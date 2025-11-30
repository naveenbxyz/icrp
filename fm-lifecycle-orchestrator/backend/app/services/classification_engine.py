"""
Classification Engine Service
Evaluates client eligibility against regulatory regime classification rules
"""
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from datetime import datetime

from ..models.classification_rule import ClassificationRule
from ..models.regime_eligibility import RegimeEligibility
from ..models.client import Client
from ..models.mandatory_evidence import MandatoryEvidence
from ..models.document import Document


class ClassificationEngine:
    """
    Engine for evaluating client eligibility based on classification rules
    """

    def __init__(self, db: Session):
        self.db = db

    def evaluate_client_eligibility(
        self,
        client_id: int,
        regime: str
    ) -> Dict[str, Any]:
        """
        Evaluate a client's eligibility for a specific regulatory regime

        Args:
            client_id: The client ID to evaluate
            regime: The regulatory regime (e.g., "RBI", "MAS", "HKMA")

        Returns:
            Dict containing eligibility result, matched/unmatched rules, and recommendations
        """
        # Get client
        client = self.db.query(Client).filter(Client.id == client_id).first()
        if not client:
            raise ValueError(f"Client {client_id} not found")

        # Get active rules for this regime
        rules = self.db.query(ClassificationRule).filter(
            ClassificationRule.regime == regime,
            ClassificationRule.is_active == True
        ).all()

        if not rules:
            return {
                "is_eligible": False,
                "reason": f"No active classification rules found for regime {regime}",
                "matched_rules": [],
                "unmatched_rules": [],
                "client_attributes": client.client_attributes or {}
            }

        # Evaluate each rule
        matched_rules = []
        unmatched_rules = []

        client_attrs = client.client_attributes or {}

        for rule in rules:
            is_match = self._evaluate_rule(rule, client_attrs)

            if is_match:
                matched_rules.append({
                    "rule_id": rule.id,
                    "rule_type": rule.rule_type,
                    "rule_name": rule.rule_name
                })
            else:
                unmatched_rules.append({
                    "rule_id": rule.id,
                    "rule_type": rule.rule_type,
                    "rule_name": rule.rule_name,
                    "expected": rule.rule_config,
                    "actual": client_attrs.get(rule.rule_type)
                })

        # Calculate data quality score
        data_quality_info = self.calculate_data_quality_score(client_id, regime)
        data_quality_score = data_quality_info["quality_score"]

        # Flag data quality exceptions
        data_quality_exceptions = []
        if data_quality_score < 90:
            data_quality_exceptions.append(f"Data quality score below optimal: {data_quality_score}%")
        if data_quality_info["missing_evidences"]:
            data_quality_exceptions.extend(data_quality_info["warnings"])

        # Client is eligible if ALL rules match
        rules_eligible = len(unmatched_rules) == 0 and len(matched_rules) > 0

        # IMPORTANT: Allow publication regardless of data quality (per plan requirements)
        can_publish_to_cx = True

        # Generate eligibility reason
        if rules_eligible and not data_quality_exceptions:
            reason = f"Client meets all {len(matched_rules)} classification rules for {regime}"
        elif rules_eligible and data_quality_exceptions:
            reason = f"Client meets all classification rules but has data quality exceptions"
        elif len(matched_rules) == 0:
            reason = f"Client does not match any classification rules for {regime}"
        else:
            reason = f"Client matches {len(matched_rules)}/{len(rules)} rules. Missing: {', '.join([r['rule_name'] for r in unmatched_rules])}"

        # Save or update regime eligibility
        eligibility = self.db.query(RegimeEligibility).filter(
            RegimeEligibility.client_id == client_id,
            RegimeEligibility.regime == regime
        ).first()

        if eligibility:
            eligibility.is_eligible = rules_eligible
            eligibility.eligibility_reason = reason
            eligibility.matched_rules = matched_rules
            eligibility.unmatched_rules = unmatched_rules
            eligibility.client_attributes = client_attrs
            eligibility.last_evaluated_date = datetime.utcnow()
        else:
            eligibility = RegimeEligibility(
                client_id=client_id,
                regime=regime,
                is_eligible=rules_eligible,
                eligibility_reason=reason,
                matched_rules=matched_rules,
                unmatched_rules=unmatched_rules,
                client_attributes=client_attrs,
                last_evaluated_date=datetime.utcnow()
            )
            self.db.add(eligibility)

        self.db.commit()
        self.db.refresh(eligibility)

        return {
            "eligibility_id": eligibility.id,
            "is_eligible": rules_eligible,
            "reason": reason,
            "matched_rules": matched_rules,
            "unmatched_rules": unmatched_rules,
            "client_attributes": client_attrs,
            "data_quality_score": data_quality_score,
            "data_quality_exceptions": data_quality_exceptions,
            "can_publish_to_cx": can_publish_to_cx,
            "evaluated_at": eligibility.last_evaluated_date.isoformat()
        }

    def _evaluate_rule(
        self,
        rule: ClassificationRule,
        client_attrs: Dict[str, Any]
    ) -> bool:
        """
        Evaluate a single rule against client attributes

        Args:
            rule: The classification rule to evaluate
            client_attrs: Client attributes dictionary

        Returns:
            True if rule matches, False otherwise
        """
        rule_type = rule.rule_type
        rule_config = rule.rule_config

        # Get the relevant client attribute value
        client_value = client_attrs.get(rule_type)

        if client_value is None:
            return False

        # Different evaluation logic based on rule type
        if rule_type == "account_type":
            return self._evaluate_account_type(rule_config, client_value)
        elif rule_type == "booking_location":
            return self._evaluate_booking_location(rule_config, client_value)
        elif rule_type == "product_grid":
            return self._evaluate_product_grid(rule_config, client_value)
        else:
            # Generic evaluation: check if client value is in allowed values
            allowed_values = rule_config.get("allowed_values", [])
            return client_value in allowed_values

    def _evaluate_account_type(
        self,
        rule_config: Dict[str, Any],
        client_value: str
    ) -> bool:
        """Evaluate account type rule"""
        in_scope = rule_config.get("in_scope", [])
        out_of_scope = rule_config.get("out_of_scope", [])

        # Check if explicitly out of scope
        if client_value in out_of_scope:
            return False

        # Check if in scope
        return client_value in in_scope

    def _evaluate_booking_location(
        self,
        rule_config: Dict[str, Any],
        client_value: str
    ) -> bool:
        """Evaluate booking location rule"""
        allowed_locations = rule_config.get("allowed_locations", [])
        allowed_patterns = rule_config.get("allowed_patterns", [])

        # Direct match
        if client_value in allowed_locations:
            return True

        # Pattern match (e.g., "India/*")
        for pattern in allowed_patterns:
            if pattern.endswith("*"):
                prefix = pattern[:-1]
                if client_value.startswith(prefix):
                    return True
            elif pattern == client_value:
                return True

        return False

    def _evaluate_product_grid(
        self,
        rule_config: Dict[str, Any],
        client_value: Dict[str, Any]
    ) -> bool:
        """
        Evaluate product grid rule
        Client value should be a dict with product attributes
        """
        if not isinstance(client_value, dict):
            return False

        required_attrs = rule_config.get("required_attributes", {})

        # Check each required attribute
        for attr_name, attr_config in required_attrs.items():
            client_attr_value = client_value.get(attr_name)

            if client_attr_value is None:
                return False

            # Check allowed values for this attribute
            allowed_values = attr_config.get("allowed_values", [])
            if allowed_values and client_attr_value not in allowed_values:
                return False

        return True

    def evaluate_all_regimes(
        self,
        client_id: int
    ) -> Dict[str, Any]:
        """
        Evaluate client eligibility across all regimes

        Args:
            client_id: The client ID to evaluate

        Returns:
            Dict mapping regime name to eligibility result
        """
        # Get all unique regimes from classification rules
        regimes = self.db.query(ClassificationRule.regime).distinct().all()
        regimes = [r[0] for r in regimes]

        results = {}
        for regime in regimes:
            try:
                results[regime] = self.evaluate_client_eligibility(client_id, regime)
            except Exception as e:
                results[regime] = {
                    "error": str(e),
                    "is_eligible": False
                }

        return results

    def calculate_data_quality_score(
        self,
        client_id: int,
        regime: str
    ) -> Dict[str, Any]:
        """
        Calculate data quality score based on mandatory evidence completeness

        Args:
            client_id: The client ID
            regime: The regulatory regime

        Returns:
            Dict with quality score, missing evidences, and warnings
        """
        # Get mandatory evidences for this regime
        mandatory_evidences = self.db.query(MandatoryEvidence).filter(
            MandatoryEvidence.regime == regime,
            MandatoryEvidence.is_mandatory == True,
            MandatoryEvidence.is_active == True
        ).all()

        if not mandatory_evidences:
            return {
                "quality_score": 100.0,
                "total_evidences": 0,
                "completed_evidences": 0,
                "missing_evidences": [],
                "warnings": []
            }

        # Get client documents
        client_docs = self.db.query(Document).filter(
            Document.client_id == client_id
        ).all()

        # Map documents by category
        doc_categories = {doc.document_category.value for doc in client_docs}

        missing_evidences = []
        warnings = []

        for evidence in mandatory_evidences:
            # Check if document exists for this evidence type
            # In a real system, you'd have a more sophisticated mapping
            has_document = evidence.evidence_type in doc_categories

            if not has_document:
                missing_evidences.append({
                    "evidence_id": evidence.id,
                    "evidence_type": evidence.evidence_type,
                    "evidence_name": evidence.evidence_name,
                    "category": evidence.category.value,
                    "description": evidence.description
                })
                warnings.append(f"Missing mandatory evidence: {evidence.evidence_name}")

        total_count = len(mandatory_evidences)
        completed_count = total_count - len(missing_evidences)
        quality_score = (completed_count / total_count * 100) if total_count > 0 else 100.0

        return {
            "quality_score": round(quality_score, 2),
            "total_evidences": total_count,
            "completed_evidences": completed_count,
            "missing_evidences": missing_evidences,
            "warnings": warnings
        }

    def retrigger_all_evaluations(
        self,
        regime: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Re-trigger eligibility evaluation for all clients
        Useful when classification rules are updated

        Args:
            regime: Optional - specific regime to re-evaluate (None = all regimes)

        Returns:
            Summary of re-evaluation results
        """
        # Get all clients
        clients = self.db.query(Client).all()

        # Get regimes to evaluate
        if regime:
            regimes = [regime]
        else:
            regimes = [r[0] for r in self.db.query(ClassificationRule.regime).distinct().all()]

        results = {
            "total_clients": len(clients),
            "regimes_evaluated": regimes,
            "results_by_regime": {}
        }

        for reg in regimes:
            eligible_count = 0
            ineligible_count = 0
            error_count = 0

            for client in clients:
                try:
                    result = self.evaluate_client_eligibility(client.id, reg)
                    if result["is_eligible"]:
                        eligible_count += 1
                    else:
                        ineligible_count += 1
                except Exception:
                    error_count += 1

            results["results_by_regime"][reg] = {
                "eligible": eligible_count,
                "ineligible": ineligible_count,
                "errors": error_count
            }

        return results
