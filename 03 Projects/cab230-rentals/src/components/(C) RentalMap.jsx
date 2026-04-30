import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Leaflet's default marker icons break with Vite — fix the asset paths
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

export default function RentalMap({ lat, lng, address }) {
  return (
    <MapContainer center={[lat, lng]} zoom={14} style={{ height: '400px', width: '100%', borderRadius: '8px' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Marker position={[lat, lng]}>
        <Popup>{address}</Popup>
      </Marker>
    </MapContainer>
  )
}
