import { useState } from 'react'
import { TaxiList } from './TaxiList'
import { TaxiCalendarView } from './TaxiCalendarView'

export function TaxiPage() {
  const [selectedPlate, setSelectedPlate] = useState<string | null>(null)

  if (selectedPlate) {
    return (
      <TaxiCalendarView
        plate={selectedPlate}
        onBack={() => setSelectedPlate(null)}
      />
    )
  }

  return <TaxiList onTaxiSelect={setSelectedPlate} />
}
