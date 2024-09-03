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
import { Input } from '@/components/ui/input';
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

const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

mapboxgl.accessToken = accessToken;

type TDrawerProps = {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  children: ReactNode;
};

export default function AddVolunteer({
  open,
  onOpenChange,
  children,
}: TDrawerProps) {
  const zoom = 6;
  const center = { lat: 23.4667, lng: 90.4354546 };
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    console.log(mapContainer.current);

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
  console.log('map', map, open);

  useEffect(() => {
    if (!open && map) {
      map.remove();
      setMap(null);
    }
  }, [open, map]);
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      onClose={() => onOpenChange(!open)}
    >
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <div className="h-[90vh] overflow-y-auto">
          <Container className="mx-auto w-full ">
            <DrawerHeader className=" w-full">
              <DrawerTitle className="text-left font-semibold">
                Add Volunteer
              </DrawerTitle>
              <div className="flex justify-end gap-3">
                <Button variant={'danger'} className="px-8">
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
              <div className="flex md:flex-row flex-col md:justify-between">
                {/* inputs section */}
                <div className="md:w-1/2 w-full  p-3 flex flex-col gap-4">
                  {/* name, number, org */}
                  <div className="w-full flex flex-col gap-5 ">
                    <div className="flex flex-col lg:flex-row lg:items-center w-full  gap-2 2xl:gap-24 lg:gap-18">
                      <Label className="w-[160px]  text-nowrap">
                        Volunteer name
                      </Label>
                      <Input
                        className=" w-full border"
                        placeholder="Name of the Volunteer"
                      />
                    </div>
                    <div className="flex flex-col lg:flex-row lg:items-center w-full  gap-2 2xl:gap-24 lg:gap-18">
                      <Label className="w-[160px]  text-nowrap">
                        Contact number
                      </Label>
                      <Input
                        className=" w-full border"
                        placeholder="+8801800xxxxxxx"
                      />
                    </div>
                    <div className="flex flex-col lg:flex-row lg:items-center w-full  gap-2 2xl:gap-24 lg:gap-18">
                      <Label className="w-[160px]  text-nowrap">
                        Organization
                      </Label>
                      <Input
                        className=" w-full border"
                        placeholder="Affiliated Organization"
                      />
                    </div>
                  </div>
                  <Separator />
                  {/* status */}
                  <div className="flex items-center gap-20 w-full lg:w-1/2">
                    <Label className="">Status</Label>
                    <Select value={'active'} onValueChange={(value) => {}}>
                      <SelectTrigger className="w-full bg-[#F3F6F8]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* district  , thana*/}
                  <div className="flex md:gap-6 gap-3 lg:flex-row flex-col">
                    <div className="flex items-center gap-20 w-full">
                      <Label className="">District</Label>
                      <Select value={'Feni'} onValueChange={(value) => {}}>
                        <SelectTrigger className="w-full bg-[#F3F6F8]">
                          <Image
                            src={icons.Location2}
                            alt="location icon"
                            height={16}
                            width={16}
                          />{' '}
                          <SelectValue placeholder="Feni" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Feni">Feni</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-20 w-full">
                      <Label className="">Thana</Label>
                      <Select value={'parshuram'} onValueChange={(value) => {}}>
                        <SelectTrigger className="w-full bg-[#F3F6F8]">
                          <Image
                            src={icons.Location2}
                            alt="location icon"
                            height={16}
                            width={16}
                          />{' '}
                          <SelectValue placeholder="" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parshuram">Parshuram</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* address */}
                  <div className="flex flex-col md:flex-row md:items-center w-full  gap-2 md:gap-24">
                    <Label className="w-[160px]  text-nowrap">Address</Label>
                    <Input
                      className=" w-full border"
                      placeholder="Area/Union/Ward details"
                    />
                  </div>
                  {/* latitude and longitude */}
                  <div className="flex gap-3 md:gap-6 flex-col lg:flex-row">
                    <div className="flex flex-col md:flex-row justify-between md:items-center w-full">
                      <Label className=" w-[160px]">Latitude</Label>
                      <Input
                        className=" w-full border"
                        placeholder="23.93933"
                      />
                    </div>
                    <div className="flex flex-col md:flex-row justify-between md:items-center w-full">
                      <Label className="w-[160px] ">Longitude</Label>
                      <Input
                        className=" w-full border"
                        placeholder="91.36479"
                      />
                    </div>
                  </div>

                  {/* biography */}
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-10">
                    <Label>Biography</Label>
                    <Textarea placeholder="Write a few sentences about the hazard..." />
                  </div>
                </div>
                <div className="md:w-1/2 w-full  rounded overflow-hidden relative">
                  <div className="w-3/5  absolute  volunteer-form-map left-5 top-5 rounded-full  z-[10] ">
                    <SearchBox
                      accessToken={accessToken}
                      map={map}
                      mapboxgl={mapboxgl}
                      value={''}
                      placeholder="Search location"
                      onChange={(d) => {
                        // setInputValue(d);
                      }}
                      marker
                      theme={{
                        variables: {
                          unit: '14px',
                          borderRadius: '20px',
                          boxShadow: 'none',
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
            <DrawerFooter>
              <div className="flex md:flex-row flex-col justify-center items-center gap-5 ">
                <DrawerClose asChild>
                  <Button variant="outline" className="w-[290px]">
                    Cancel
                  </Button>
                </DrawerClose>
                <Button variant={'purple'} className="w-[290px] ">
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
