export default function RewardFlash({ show }) {
  if (!show) return null
  return <div className="reward-flash" aria-hidden />
}
