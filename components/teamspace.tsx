import { WiStars } from "react-icons/wi";

const AddTeamWorkspace = () => {
  return (
    <div
      className="flex items-center p-4 hover:bg-gray-700
           rounded-lg cursor-pointer transition-all duration-200"
    >
      <WiStars className="text-3xl text-white " />
      <div className="ml-2">
        <div className="text-white text-sm ">Add Team workspace</div>
        <div className="text-xs text-gray-300">Collaborate on a Team plan</div>
      </div>
    </div>
  );
};

export default AddTeamWorkspace;
