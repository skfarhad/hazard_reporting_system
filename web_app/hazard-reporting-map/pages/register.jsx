import Image from "next/image";
import DropdownButton from "../components/Dropdown";
import RegistrationForm from "../components/RegistrationForm";
import SocialLogins from "../components/SocialLogin";


export default function RegistrationPage() {
    return (
        <section className="h-screen place-items-center" style={{ fontFamily: 'Manrope, sans-serif' }}>
            <div className="flex items-center">
                <div className="max-w-[450px] w-full mx-auto p-6 mt-[124px] rounded-md">
                <h4 className="font-manrope text-[28px] font-semibold leading-[38.25px] text-center">
                        Welcome to Hazard Reporting System
                    </h4>
                    <RegistrationForm />
                    <SocialLogins mode={"register"} />
                </div>            
            </div>
        </section>
    );
}
