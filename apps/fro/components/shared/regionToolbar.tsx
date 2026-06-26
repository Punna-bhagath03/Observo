import RegionSelect, { type Region } from "@/components/shared/regionSelect"

type RegionToolbarProps = {
  regions: Region[]
  selectedRegionId: string
  onRegionChange: (regionId: string) => void
  disabled?: boolean
  children?: React.ReactNode
}

export default function RegionToolbar({
  regions,
  selectedRegionId,
  onRegionChange,
  disabled,
  children,
}: RegionToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
      <RegionSelect
        regions={regions}
        value={selectedRegionId}
        onChange={onRegionChange}
        disabled={disabled}
      />
      {children}
    </div>
  )
}
