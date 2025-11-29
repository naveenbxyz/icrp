import { useQuery } from '@tanstack/react-query'
import { clientsApi } from '../lib/api'
import { Client } from '../types'

export function useClients(filters?: {
  status?: string
  country_of_incorporation?: string
  search?: string
}) {
  return useQuery<Client[]>({
    queryKey: ['clients', filters],
    queryFn: () => clientsApi.getAll(filters),
  })
}

export function useClient(id: number) {
  return useQuery<Client>({
    queryKey: ['client', id],
    queryFn: () => clientsApi.getById(id),
    enabled: !!id,
  })
}
