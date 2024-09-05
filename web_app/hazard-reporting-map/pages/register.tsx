import Image from 'next/image';
import DropdownButton from '../components/Dropdown';
import RegistrationForm from '../components/RegistrationForm';
import SocialLogins from '../components/SocialLogin';

export default function RegistrationPage() {
  return (
    <section className="h-screen grid place-items-center font-manrope">
      <div className="flex items-center  w-max h-max">
        <div className="max-w-[450px] w-full mx-auto p-6 rounded-md">
          <h4 className="font-manrope text-[28px] font-semibold leading-[38.25px] text-center">
            Welcome to Hazard Reporting System
          </h4>
          <RegistrationForm />
          <SocialLogins mode={'register'} />
        </div>
      </div>
    </section>
  );
}
