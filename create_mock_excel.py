import pandas as pd

# Creando un DataFrame ficticio simulando el exportado de un programa de farmacia
data = {
    'Código Nacional': ['123456', '789012', '345678', '901234'],
    'Descripción': ['PARACETAMOL 1G', 'IBUPROFENO 600MG', 'AMOXICILINA 500MG', 'OMEPRAZOL 20MG'],
    'Lote': ['L-100', 'L-200', 'L-300', 'L-400'],
    'F. Caducidad': ['2026-12-31', '2025-06-30', '2027-01-15', '2026-08-20'],
    'Stock': [500, 300, 150, 1000]
}

df = pd.DataFrame(data)

# Guardar en un Excel en la raíz
excel_path = 'mock_inventario.xlsx'
df.to_excel(excel_path, index=False)
print(f"Mock Excel guardado en: {excel_path}")
