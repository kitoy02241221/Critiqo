import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://Critiqo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1cXllcmllY2FjeWlocnRycHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTI4MDIsImV4cCI6MjA3MDMyODgwMn0.fBE5v2UdFL5ZYl2pTPoRd_DBs5OOz-pWxkwjZjL0gZQ'
export const supabase = createClient(supabaseUrl, supabaseKey)