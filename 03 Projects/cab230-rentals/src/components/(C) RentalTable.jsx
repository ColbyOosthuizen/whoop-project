import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'

ModuleRegistry.registerModules([AllCommunityModule])

const columnDefs = [
  { field: 'title', headerName: 'Title', flex: 2, minWidth: 180 },
  { field: 'rent', headerName: 'Rent/wk', width: 110, valueFormatter: p => p.value != null ? `$${p.value}` : '' },
  { field: 'propertyType', headerName: 'Type', width: 130 },
  { field: 'suburb', headerName: 'Suburb', flex: 1, minWidth: 120 },
  { field: 'state', headerName: 'State', width: 90 },
  { field: 'postcode', headerName: 'Postcode', width: 100 },
  { field: 'bedrooms', headerName: 'Beds', width: 80 },
  { field: 'bathrooms', headerName: 'Baths', width: 80 },
]

export default function RentalTable({ rowData, onRowClick }) {
  return (
    <div style={{ height: 500, width: '100%' }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        onRowClicked={(e) => onRowClick(e.data.id)}
        rowStyle={{ cursor: 'pointer' }}
        defaultColDef={{ sortable: true, resizable: true }}
      />
    </div>
  )
}
