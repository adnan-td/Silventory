import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  maxRetries: 7,
  token: process.env.SANITY_SILVENTORY_API_TOKEN,
})

export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  maxRetries: 7,
  token: process.env.SANITY_SILVENTORY_API_TOKEN,
})
