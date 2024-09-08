'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

const RegistrationForm = () => {
  const router = useRouter();
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile: string) => {
    const mobileRegex = /^01[3-9]\d{8}$/;
    return mobileRegex.test(mobile);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fname = formData.get('fname') as string;
    const mobile = formData.get('mobile') as string;
    const email = formData.get('email') as string;
    const contribution = formData.get('contribution');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!validateMobile(mobile)) {
      setError('Please enter a valid Bangladeshi mobile number.');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          fname,
          mobile,
          email,
          contribution,
        }),
      });
      response.status === 201 && router.push('/login');
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <>
      {error && (
        <div className="text-2xl text-center text-red-500">{error}</div>
      )}
      <form className="login-form" onSubmit={onSubmit}>
        <div>
          <label htmlFor="fname" className="text-gray-600">
            Full Name
          </label>
          <input
            type="text"
            name="fname"
            id="fname"
            placeholder="Enter your name"
            className="w-full px-2 py-2 text-base border border-gray-300 rounded outline-none focus:ring-blue-500 focus:border-blue-500 focus:ring-1"
          />
        </div>

        <div>
          <label htmlFor="mobile" className="text-gray-600">
            Mobile No.
          </label>
          <input
            type="text"
            name="mobile"
            id="mobile"
            placeholder="Enter your mobile number"
            pattern="^01[3-9]\d{8}$"
            title="Please enter a valid 11-digit Bangladeshi mobile number starting with 01."
            required
            className="w-full px-2 py-2 text-base border border-gray-300 rounded outline-none focus:ring-blue-500 focus:border-blue-500 focus:ring-1"
          />
        </div>

        <div>
          <label htmlFor="email" className="text-gray-600">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="Enter your email"
            required
            className="w-full px-2 py-2 text-base border border-gray-300 rounded outline-none focus:ring-blue-500 focus:border-blue-500 focus:ring-1"
          />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <span className="text-gray-600">I want to contribute as-</span>
          <select
            name="contribute"
            id="contribute"
            className="w-32 ml-auto bg-[#F3F6F8]"
          >
            <option value="Admin" selected>
              Admin
            </option>
            <option value="Informer" selected>
              Informer
            </option>
            <option value="Personnel" selected>
              Personnel
            </option>
            <option value="Guest" selected>
              Guest
            </option>
          </select>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: '60px',
          }}
        >
          <input
            id="link-checkbox"
            type="checkbox"
            value=""
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label
            htmlFor="link-checkbox"
            className="text-sm font-medium text-[#0F172A] dark:text-[rgb(15,23,42)]"
          >
            {' '}
            I agree with{' '}
            <a
              href="#"
              className="text-[#3076FF] dark:text-[#3076FF] underline hover:underline"
            >
              Privacy Policy
            </a>{' '}
            and{' '}
            <a
              href="#"
              className="text-[#3076FF] dark:text-[#3076FF] underline hover:underline"
            >
              Terms and Conditions
            </a>
          </label>
        </div>

        <button
          type="submit"
          className="btn-primary w-[415px] h-[52px] pt-[10px] pr-[150px] pb-[10px] pl-[150px] rounded-sm font-medium text-[20px]"
        >
          Create account
        </button>
      </form>
    </>
  );
};

export default RegistrationForm;
