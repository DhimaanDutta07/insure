import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import UserImg from "../../assets/user.png";
import { useAuth } from "../../Context/AuthContext";
import { User } from "../../types";

export function UserNav({ user }: { user: User }) {
  const { logout } = useAuth();

  async function onLogout() {
    logout();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="
            flex items-center gap-2 p-1 sm:p-2
            transition-all duration-300 
            hover:bg-gray-800/50 
            hover:shadow-lg hover:shadow-red-500/10
          "
        >
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 transition-transform duration-300 hover:scale-110">
            <AvatarImage src={UserImg} alt="User" className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-red-600 to-gray-800 text-white">
              U
            </AvatarFallback>
          </Avatar>
          <div className='text-xs sm:text-sm hidden sm:block'>{user.email}</div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="
          w-56 sm:w-64 py-3 sm:py-4 px-2 
          bg-gradient-to-b from-gray-500/95 to-black/95 
          backdrop-blur-md border border-gray-800/50 
          shadow-xl shadow-black/20 
          rounded-xl
          text-white
        " 
        align="end" 
        forceMount
      >
        <DropdownMenuLabel className="font-normal px-2 mb-2">
          <div className="flex flex-col space-y-1 sm:space-y-2">
            <p className="
              text-xs sm:text-sm font-medium 
              bg-gray-800/30 px-2 py-1 
              rounded-md w-fit
              transition-all duration-200
              hover:bg-red-600/20
            ">
              VRV Solutions
            </p>
            <p className="
              text-[10px] sm:text-xs text-gray-400 
              bg-gray-800/20 px-2 py-1 
              rounded-md w-fit
            ">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-800/30 my-1 sm:my-2" />
        <DropdownMenuItem 
          className="
            cursor-pointer 
            text-gray-200 
            px-2 sm:px-3 py-1.5 sm:py-2 
            rounded-lg
            transition-all duration-300
            hover:bg-red-600/20 
            hover:text-white 
            focus:bg-red-600/30 
            focus:text-white
            group
          " 
          onClick={onLogout}
        >
          <span className="relative z-10 text-xs sm:text-sm">Log out</span>
          <DropdownMenuShortcut>
            <LogOut className="
              h-3 w-3 sm:h-4 sm:w-4 
              text-gray-400 
              group-hover:text-red-400 
              transition-colors duration-300
            " />
          </DropdownMenuShortcut>
          <div className="
            absolute inset-0 
            bg-red-600 
            opacity-0 
            group-hover:opacity-10 
            rounded-lg 
            transition-opacity duration-300
          " />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}