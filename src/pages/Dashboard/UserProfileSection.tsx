import PrimaryBoard from "../../components/boards/PrimaryBoard";
import FilledButton from "../../components/buttons/FilledButton";
import Section from "./Section";

// --------------------------------------------------------------------------------------------

export default function UserProfileSection() {
  return (
    <Section title="User Profile">
      <div className="grid grid-cols-4 gap-4 h-64">
        <PrimaryBoard title="User Reserves" className="col-span-2">
          <div className="px-4 flex flex-col items-center justify-center gap-4 h-full">
            <p className="text-gray-100 text-center">You have no profile to deposit or borrow.</p>
            <FilledButton>Create profile</FilledButton>
          </div>
        </PrimaryBoard>
        <PrimaryBoard title="Actions">
          <div className="flex flex-col justify-center h-full">
            <p className="text-gray-100 text-center">No Actions</p>
          </div>
        </PrimaryBoard>
        <PrimaryBoard title="Liquidations">
          <div className="flex flex-col justify-center h-full">
            <p className="text-gray-100 text-center">No Actions</p>
          </div>
        </PrimaryBoard>
      </div>
    </Section>
  )
}