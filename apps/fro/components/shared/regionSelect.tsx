export type Region = {
  id: string
  name: string
}

type RegionSelectProps = {
  regions: Region[]
  value: string
  onChange: (regionId: string) => void
  disabled?: boolean
}

export default function RegionSelect({
  regions,
  value,
  onChange,
  disabled,
}: RegionSelectProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-medium text-gray-200 outline-none transition-colors hover:bg-white/10 focus:border-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {regions.map((region) => (
        <option key={region.id} value={region.id} className="bg-[#0d0d15]">
          {region.name}
        </option>
      ))}
    </select>
  )
}
