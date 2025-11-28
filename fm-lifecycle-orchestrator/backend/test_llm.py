#!/usr/bin/env python3
"""
Simple script to test LLM integration directly.
Run this to verify your LLM API is working without needing the full app.
"""

import sys
import os

# Add app directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_service import ai_service

def test_llm():
    """Test LLM integration with a simple message"""

    print("=" * 60)
    print("LLM Integration Test")
    print("=" * 60)

    # Show configuration
    print(f"\nConfiguration:")
    print(f"  LLM Enabled: {ai_service.llm_enabled}")
    print(f"  LLM Stream: {ai_service.llm_stream}")
    print(f"  Client Initialized: {ai_service.client is not None}")

    if not ai_service.llm_enabled:
        print("\n❌ LLM is not enabled!")
        print("   Set LLM_ENABLED=true in .env file")
        return False

    if not ai_service.client:
        print("\n❌ LLM client not initialized!")
        print("   Check LLM_API_KEY and LLM_API_ENDPOINT in .env file")
        return False

    # Test general mode (no client context)
    print(f"\n" + "=" * 60)
    print("Test 1: General mode (no client context)")
    print("=" * 60)

    test_message = "Hello, can you help me?"
    print(f"\n📤 Sending: {test_message}")

    try:
        response = ai_service.chat_with_assistant(
            message=test_message,
            context=None,
            full_client_data=None
        )

        print(f"\n✅ Response received!")
        print(f"   Source: {response.get('source', 'unknown')}")
        print(f"   Topic: {response.get('topic', 'unknown')}")
        print(f"\n📥 Message:\n   {response['message']}")
        print(f"\n💡 Suggestions:")
        for s in response.get('suggestions', []):
            print(f"   - {s}")

        if response.get('source') == 'llm_general':
            print(f"\n🎉 SUCCESS! LLM is working in general mode!")
            return True
        elif response.get('source') == 'simulation':
            print(f"\n⚠️ WARNING: Still using simulation mode")
            print(f"   Check that LLM_ENABLED=true in .env")
            return False

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("\nTesting LLM Integration...\n")
    success = test_llm()
    print("\n" + "=" * 60)
    if success:
        print("✅ LLM integration is working!")
        print("\nNext steps:")
        print("1. Make sure you're using the chat on a client detail page")
        print("2. The chat will use RAG with full client context")
        print("3. Check backend logs for detailed information")
    else:
        print("❌ LLM integration test failed")
        print("\nTroubleshooting:")
        print("1. Check that LLM_ENABLED=true in .env")
        print("2. Verify LLM_API_KEY is set correctly")
        print("3. Verify LLM_API_ENDPOINT is correct")
        print("4. Check network connectivity to the API")
        print("5. Review error messages above")
    print("=" * 60 + "\n")

    sys.exit(0 if success else 1)
