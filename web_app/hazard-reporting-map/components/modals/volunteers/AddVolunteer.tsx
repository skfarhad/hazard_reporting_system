import React, {
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import Container from '@/components/layouts/Container';
import { Label } from '@/components/ui/label';
import { Input, InputProps } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import mapboxgl from 'mapbox-gl';
import { SearchBox } from '@mapbox/search-js-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';
import { icons } from '@/assets/icons';
import { Textarea } from '@/components/ui/textarea';
import { MarkerData } from '@/types/MarkerData';
import 'mapbox-gl/dist/mapbox-gl.css';
import { toast } from 'sonner';
import { cn } from '@/libs/utils';

const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

mapboxgl.accessToken = accessToken;
const SafeSearchBox = SearchBox as React.ComponentType<any>;

type TInputProps = {
  disabled: boolean;
  label: string;
  inputClassName?: string;
  labelClassName?: string;
  className?: string;
} & InputProps;
const WiderInput = ({
  disabled,
  label,
  name,
  inputClassName,
  labelClassName,
  className,
  ...inputProps
}: TInputProps) => {
  return (
    <div
      className={cn(
        'flex flex-col lg:flex-row lg:items-center w-full  gap-2 2xl:gap-24 lg:gap-18',
        className
      )}
    >
      <Label id={name} className={cn('w-[160px]  text-nowrap', labelClassName)}>
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        className={cn(' w-full border flex-1', inputClassName)}
        {...inputProps}
        disabled={disabled}
      />
    </div>
  );
};

const SmallInput = ({
  disabled,
  label,
  name,
  inputClassName,
  labelClassName,
  className,
  ...inputProps
}: TInputProps) => {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row justify-between md:items-center w-full',
        className
      )}
    >
      <Label className={cn('w-[160px]', labelClassName)}>{label}</Label>
      <Input
        id={name}
        name={name}
        className={cn(' w-full border flex-1', inputClassName)}
        {...inputProps}
        disabled={disabled}
      />
    </div>
  );
};
interface DropDownOption<T> {
  value: T;
  label: string; // Use string for label to handle text display
}

interface TDropDown<T> {
  value: T;
  onChange: (value: string) => void;
  options: DropDownOption<T>[];
  label: string;
  name: string;
  placeholder: string;
  icon?: ReactNode;
}

const DropDown = ({
  value,
  onChange,
  options,
  label,
  name,
  placeholder,
  icon,
}: TDropDown<string>) => {
  return (
    <div className="flex items-center gap-20 w-full lg:w-1/2">
      <Label className="">{label}</Label>
      <Select value={value} name={name} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-[#F3F6F8]">
          {icon ? icon : null}
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((itm, i) => {
            return (
              <SelectItem key={i} value={itm.value}>
                {itm.label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

type TDrawerProps = {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  children: ReactNode;
};

const initialFormInfo = {
  volunteerName: '',
  contactNumber: '',
  organization: '',
  status: '',
  district: '',
  thana: '',
  address: '',
  lat: '',
  lon: '',
  biography: '',
};
export default function AddVolunteer({
  open,
  onOpenChange,
  children,
}: TDrawerProps) {
  const [formInfo, setFormInfo] = useState({ ...initialFormInfo });
  const [isFormLoading, setIsFormLoading] = useState(false);
  const zoom = 6;
  const center = { lat: 23.4667, lng: 90.4354546 };
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | undefined>(undefined);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (open && isClient && !map) {
      setTimeout(() => {
        const mapInstance = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: center,
          zoom: zoom,
        });
        setMap(mapInstance);
      }, 200);
    }
  }, [open, isClient]);

  useEffect(() => {
    if (!open && map) {
      map.remove();
      setMap(undefined);
    }
  }, [open, map]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormInfo({ ...formInfo, [name]: value });
  };

  const handleDropDownChange = (value: string, name: string) => {
    setFormInfo({ ...formInfo, [name]: value });
  };

  const handleFormSubmit = () => {
    setIsFormLoading(true);
    const promise = () =>
      new Promise((resolve) =>
        setTimeout(() => resolve(onOpenChange(!open)), 2000)
      );

    toast.promise(promise, {
      loading: 'Wait a second...',
      success: () => {
        setIsFormLoading(false);
        return `Volunteer added!`;
      },
      error: 'Error',
    });
  };

  const handleDelete = () => {
    setIsFormLoading(true);
    const promise = () =>
      new Promise((resolve) =>
        setTimeout(() => resolve(onOpenChange(!open)), 2000)
      );

    toast.promise(promise, {
      loading: 'Wait a second...',
      success: () => {
        setIsFormLoading(false);
        return `Volunteer removed!`;
      },
      error: 'Error',
    });
  };
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      onClose={() => onOpenChange(!open)}
    >
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <div className="h-max overflow-y-auto">
          <Container className="max-w-[1220px] w-full ">
            <DrawerHeader className=" w-full  p-0 pb-8">
              <DrawerTitle className="text-left font-semibold">
                Add Volunteer
              </DrawerTitle>
              <div className="flex justify-end gap-3">
                <Button
                  onClick={handleDelete}
                  variant={'danger'}
                  className="px-8"
                  disabled={isFormLoading}
                >
                  Delete
                </Button>
                <DrawerClose asChild>
                  <Button
                    variant="outline"
                    className="bg-transparent rounded-none border-[#49454F] px-2 text-[#49454F]"
                  >
                    <X />
                  </Button>
                </DrawerClose>
              </div>
            </DrawerHeader>
            <div className=" p-0 pb-0">
              <div className="flex md:flex-row flex-col gap-4 lg:gap-8 md:justify-between">
                {/* inputs section */}
                <div className="md:w-1/2 w-full  p-3 flex flex-col gap-4">
                  {/* name, number, org */}
                  <div className="w-full flex flex-col gap-5 ">
                    <WiderInput
                      name="volunteerName"
                      label="Volunteer Name"
                      placeholder="Name of the Volunteer"
                      onChange={handleInputChange}
                      value={formInfo.volunteerName}
                      disabled={isFormLoading}
                    />
                    <WiderInput
                      placeholder="+8801800xxxxxxx"
                      name="contactNumber"
                      onChange={handleInputChange}
                      value={formInfo.contactNumber}
                      disabled={isFormLoading}
                      label="Contact number"
                    />

                    <WiderInput
                      label="Organization"
                      placeholder="Affiliated Organization"
                      name="organization"
                      onChange={handleInputChange}
                      value={formInfo.organization}
                      disabled={isFormLoading}
                    />
                  </div>
                  <Separator />
                  {/* status */}

                  <DropDown
                    value={formInfo.status}
                    name="status"
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                    ]}
                    onChange={(value) => handleDropDownChange(value, 'status')}
                    label="Status"
                    placeholder="Status"
                  />
                  {/* district  , thana*/}
                  <div className="flex md:gap-6 gap-3 lg:flex-row flex-col">
                    <DropDown
                      label="District"
                      name="district"
                      onChange={(value) =>
                        handleDropDownChange(value, 'district')
                      }
                      value={formInfo.district}
                      placeholder="District"
                      options={[
                        { value: 'feni', label: 'Feni' },
                        { value: 'chittagong', label: 'Chittagong' },
                      ]}
                      icon={
                        <Image
                          src={icons.Location2}
                          alt="location icon"
                          height={16}
                          width={16}
                        />
                      }
                    />

                    <DropDown
                      label="Thana"
                      name="thana"
                      onChange={(value) => handleDropDownChange(value, 'thana')}
                      value={formInfo.thana}
                      placeholder="Thana"
                      options={[
                        { value: 'parshuram', label: 'Parshuram' },
                        { value: 'sadarghat', label: 'Sadarghat' },
                      ]}
                      icon={
                        <Image
                          src={icons.Location2}
                          alt="location icon"
                          height={16}
                          width={16}
                        />
                      }
                    />
                  </div>

                  {/* address */}
                  <WiderInput
                    name="address"
                    placeholder="Area/Union/Ward details"
                    onChange={handleInputChange}
                    value={formInfo.address}
                    disabled={isFormLoading}
                    label="Address"
                  />
                  {/* latitude and longitude */}
                  <div className="flex gap-3 md:gap-6 flex-col lg:flex-row">
                    <SmallInput
                      placeholder="23.93933"
                      name="lat"
                      onChange={handleInputChange}
                      value={formInfo.lat}
                      disabled={isFormLoading}
                      label="Latitude"
                    />
                    <SmallInput
                      label={'Longitude'}
                      placeholder="91.36479"
                      name="lon"
                      onChange={handleInputChange}
                      value={formInfo.lon}
                      disabled={isFormLoading}
                    />
                  </div>

                  {/* biography */}
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-10">
                    <Label>Biography</Label>
                    <Textarea
                      name="biography"
                      placeholder="Write a few sentences about the hazard..."
                      onChange={handleInputChange}
                      value={formInfo.biography}
                      disabled={isFormLoading}
                    />
                  </div>
                </div>

                {/* map section */}
                <div className="md:w-1/2 w-full  rounded overflow-hidden relative">
                  <div className="w-3/5  absolute  volunteer-form-map left-5 top-5 rounded-full  z-[10] ">
                    <SafeSearchBox
                      accessToken={accessToken}
                      map={map}
                      mapboxgl={mapboxgl}
                      value={''}
                      placeholder="Search location"
                      onChange={(d: string) => {}}
                      marker
                      theme={{
                        variables: {
                          unit: '14px',
                          borderRadius: '20px',
                          boxShadow: 'none',
                          padding: '1em',
                        },
                      }}
                    />
                  </div>
                  <div
                    ref={mapContainer}
                    style={{ width: '100%', height: '60vh' }}
                  />
                </div>
              </div>
            </div>
            <DrawerFooter className="mt-10">
              <div className="flex md:flex-row flex-col justify-center items-center gap-3 ">
                <DrawerClose asChild>
                  <Button
                    variant="outline"
                    className="w-[290px]"
                    disabled={isFormLoading}
                  >
                    Cancel
                  </Button>
                </DrawerClose>
                <Button
                  onClick={handleFormSubmit}
                  variant={'purple'}
                  className="w-[290px] "
                  disabled={isFormLoading}
                >
                  Confirm
                </Button>
              </div>
            </DrawerFooter>
          </Container>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
