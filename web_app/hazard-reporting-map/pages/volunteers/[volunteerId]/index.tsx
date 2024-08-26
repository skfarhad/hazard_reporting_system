import Image from 'next/image'
import { useRouter } from 'next/router'
import React from 'react'

const VolunteerDetailsPage = () => {
  const router = useRouter()
  const VolunteerId = router.query.volunteerId
  return (
    <div className='mx-auto px-8'>
      <div>
      <h1 className="py-8 text-3xl font-bold text-gray-600 mb-6 text-center">Incident ID: {VolunteerId}</h1>
      </div>
    <div className="md:flex items-start justify-center">
      <div className="xl:w-2/6 lg:w-2/6 w-80 md:block hidden">
        <Image loading='eager' quality="100" height={400} width={266} className="w-full" alt="image of a volunteer" src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=3574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />
      </div>
      <div className="md:hidden">
          <Image loading='eager' quality="100" height={400} width={266} className="w-full" alt="image of a volunteer" src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=3574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" />
      </div> 
      <div className="md:w-1/2 lg:ml-8 md:ml-6 md:mt-0 mt-6">
        <div>
          <p className="text-base leading-4 mt-7 text-gray-600 dark:text-gray-600">Name: Abdul Hamid</p>
          <p className="text-base leading-4 mt-4 text-gray-600 dark:text-gray-600">District: Feni</p>
          <p className="text-base leading-4 mt-4 text-gray-600 dark:text-gray-600">Thana: Parshuram</p>
          <p className="text-base leading-4 mt-4 text-gray-600 dark:text-gray-600">Latitute: 23.3122</p>
          <p className="text-base leading-4 mt-4 text-gray-600 dark:text-gray-600">Longitude: 90.123</p>
          <p className="text-base leading-4 mt-4 text-gray-600 dark:text-gray-600">Rescue Type: Food Support</p>
          <p className="text-base lg:leading-tight leading-normal text-gray-600 dark:text-gray-600 mt-7">Phasellus tristique massa maximus, venenatis ex ac, accumsan ante. Donec sit amet tempor dui, eget ultricies sem. In vel finibus arcu. In neque risus, placerat quis vestibulum nec, gravida a est. Quisque pretium orci sit amet semper sagittis. Donec cursus at massa a condimentum. Nam urna ipsum, lacinia maximus turpis in, convallis laoreet nibh. Donec vitae nisl sodales, pellentesque felis quis, finibus felis. Morbi nibh ligula, dignissim a lacus sed, vulputate consectetur elit. Aenean efficitur, nibh vitae porttitor ornare, ex enim tristique leo, ac elementum libero lorem eu orci. Pellentesque fermentum ut ante venenatis pulvinar. Donec lobortis, orci quis euismod cursus, nisi mauris porttitor lacus, non tincidunt lorem metus a nibh. Integer tempor tincidunt dignissim. Curabitur commodo, neque non ultricies semper, mauris turpis aliquam lorem, sit amet dictum arcu nulla non magna.

Vestibulum id finibus libero, eu facilisis urna. Sed in dui vel sapien tristique interdum. Fusce tincidunt lorem et libero luctus, vel volutpat massa gravida. Fusce at dui non nisi bibendum euismod. Cras interdum aliquam velit id sollicitudin. Aliquam volutpat ligula quis mauris vestibulum, eget elementum augue porttitor. Donec metus purus, efficitur eu gravida vitae, feugiat at sapien. Pellentesque imperdiet est odio, at faucibus quam rhoncus eget. Nam rutrum maximus pretium. Fusce consectetur nunc nulla, vitae imperdiet lorem porttitor et. Maecenas vitae lacus nibh. Aliquam erat volutpat. Mauris sit amet malesuada dui. Maecenas ultricies tincidunt dui sed faucibus.

Cras hendrerit sapien sit amet urna imperdiet, ac lobortis justo gravida. Cras sed lectus sem. Aliquam tincidunt molestie lacus, a tincidunt dui suscipit sodales. Sed nec nisl id quam luctus ultricies et ut magna. Sed purus libero, varius ut ultricies id, fermentum eget diam. Vivamus pellentesque turpis in ligula malesuada interdum. Praesent quis dignissim lorem, ut vestibulum augue. Proin a quam arcu. Pellentesque mattis semper nisi a convallis. Pellentesque lacinia nibh non lacus viverra faucibus. Phasellus condimentum vehicula purus in vestibulum. Curabitur laoreet nunc eget augue dapibus scelerisque. Praesent luctus rhoncus tellus eu volutpat.</p>
        </div>
        <div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default VolunteerDetailsPage
