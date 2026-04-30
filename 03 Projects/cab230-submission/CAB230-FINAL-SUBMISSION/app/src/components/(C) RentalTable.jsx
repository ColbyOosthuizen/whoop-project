import { useRef, useEffect } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { searchRentals } from '../services/(C) rentalsApi'

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

// cacheBlockSize must equal the API's perPage (both 10) — do not change independently
function createDatasource(filters) {
  return {
    getRows(params) {
      const page = Math.floor(params.startRow / 10) + 1
      const sort = params.sortModel[0]
      searchRentals({
        ...filters,
        page,
        sortBy: sort?.colId,
        sortOrder: sort?.sort,
      })
        .then(response => {
          params.successCallback(response.data, response.pagination.total)
        })
        .catch(() => {
          params.failCallback()
        })
    }
  }
}

export default function RentalTable({ filters, onRowClick }) {
  const gridRef = useRef()
  const filtersRef = useRef(filters)

  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  // Replace datasource whenever filters change — clears cache and re-fetches from page 1
  useEffect(() => {
    gridRef.current?.api?.setGridOption('datasource', createDatasource(filters))
  }, [filters])

  return (
    <div style={{ height: 600, width: '100%' }}>
      <AgGridReact
        ref={gridRef}
        rowModelType="infinite"
        cacheBlockSize={10}
        maxBlocksInCache={10}
        columnDefs={columnDefs}
        defaultColDef={{ resizable: true, sortable: true }}
        overlayNoRowsTemplate="No rentals found. Try different filters."
        onGridReady={params => {
          params.api.setGridOption('datasource', createDatasource(filtersRef.current))
        }}
        onRowClicked={e => {
          if (!e.data) return
          onRowClick(e.data.id)
        }}
        rowStyle={{ cursor: 'pointer' }}
      />
    </div>
  )
}
