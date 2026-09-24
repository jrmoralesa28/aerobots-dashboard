// =====================================================
// AEROBOTS - CLIENTE DE SUPABASE
// =====================================================

const SUPABASE_URL = 'https://gekznsotrgmgojlfbfjg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdla3puc290cmdtZ29qbGZiZmpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMTc5ODEsImV4cCI6MjEwNTU5Mzk4MX0.uVUM7MHsGsUcMNUrpIW-xjXCwDVedm-LqPxVdxMwwPg';

// Crear el cliente global con un nombre distinto
// para evitar choque con la libreria del CDN
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Cliente de Supabase inicializado');