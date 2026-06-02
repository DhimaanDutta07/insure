//src/components/Navbar/Navbar.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import Logo from '../../assets/logo.jpg'
import { UserNav } from './UserNav'
import { useNavigate } from 'react-router-dom'

export default function Navbar({user}: {user: any}) {
    const navigate = useNavigate()
    return (
        <div className="flex sticky top-0 z-10 bg-gray-200 items-center justify-between px-2 sm:px-4 py-2">
            <div className="px-1 sm:px-2 py-1 sm:py-2 rounded cursor-pointer" onClick={() => navigate('/admin/userPanel')}>
                <img src={Logo} className="w-20 sm:w-28" alt="VRV Solutions" />
            </div>
            <div className="flex items-center">
                <UserNav user={user}  />
            </div>
        </div>
    )
}