import { useState } from 'react'
import type { InvitedFriend } from '../api/types'
import { FriendsScreen } from '../components/FriendsScreen'
import { ReferralSection } from '../components/ReferralSection'

interface ReferralScreenProps {
  referralCode: string
  referralLink: string | null
  friendsCount: number
  invitedPaidCount: number
  bonusDays: number
  bonusDaysPerReferral: number
  referralInviteeBonusDays: number
  invitedFriends: InvitedFriend[]
  onShare: () => void
}

export function ReferralScreen({
  referralCode,
  referralLink,
  friendsCount,
  invitedPaidCount,
  bonusDays,
  bonusDaysPerReferral,
  referralInviteeBonusDays,
  invitedFriends,
  onShare,
}: ReferralScreenProps) {
  const [friendsOpen, setFriendsOpen] = useState(false)

  return (
    <main className="px-5 pb-4">
      <div className="pt-4">
        <ReferralSection
          code={referralCode}
          referralLink={referralLink}
          friends={friendsCount}
          invitedPaidCount={invitedPaidCount}
          bonusDays={bonusDays}
          bonusDaysPerReferral={bonusDaysPerReferral}
          referralInviteeBonusDays={referralInviteeBonusDays}
          invitedFriends={invitedFriends}
          onShare={onShare}
          onViewAll={() => setFriendsOpen(true)}
        />
      </div>

      <FriendsScreen
        open={friendsOpen}
        onClose={() => setFriendsOpen(false)}
        friends={invitedFriends}
        bonusDays={bonusDays}
        bonusDaysPerReferral={bonusDaysPerReferral}
        referralInviteeBonusDays={referralInviteeBonusDays}
        invitedPaidCount={invitedPaidCount}
        totalCount={friendsCount}
      />
    </main>
  )
}
