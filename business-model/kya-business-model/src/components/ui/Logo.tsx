
import '@/app/globals.css'
import Image from "next/image";
import kyaLogo from '../../../public/kya_logo_light.png';

export default function Logo(){
    return (
        <div className="sb-brand-icon">
            <Image
                src={kyaLogo}
                width={42}
                height={42}
                alt="Logo KYA"
                priority
            />
        </div>
    )
}