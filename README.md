# SMS Based Hazard Reporting System for Flood Affected people of Bangladesh


## Project Synopsis:

### Problem Statement
In Bangladesh, effective and timely response to emergencies such as natural disasters, accidents, and other hazards is 
often hindered by the lack of a reliable communication and coordination system. Many distressed individuals in remote 
or densely populated areas struggle to report emergencies to the appropriate authorities or rescue teams due to limited
access to technology and infrastructure. Furthermore, there is no unified platform that can efficiently connect those
in need with nearby volunteers or rescue personnel in real-time.<br><br>
Traditional emergency response mechanisms rely heavily on phone calls or physical reporting, which can be time-consuming
and inefficient, especially in critical situations where every second counts. Additionally, the absence of accurate 
geo-location data during the reporting process leads to delays in locating distressed individuals, 
further exacerbating the situation.<br><br>
The challenge lies in creating a system that can leverage the widespread use of mobile phones and SMS technology in 
Bangladesh to facilitate rapid incident reporting, accurate location tracking, and efficient coordination of 
rescue efforts. Such a system would need to integrate seamlessly with the existing infrastructure 
provided by leading telecommunications companies and ensure that distressed individuals and volunteers 
can communicate and act swiftly during emergencies.<br><br>
Key Issues:
- <b>Lack of Reliable Communication Channels:</b> Distressed individuals often have no efficient means 
to report emergencies, especially in areas with poor infrastructure.
- <b>Inefficient Location Tracking:</b> Current systems lack the capability to determine the location of both the distressed 
individuals and potential rescuers accurately and quickly, leading to delayed response times.
- <b>Uncoordinated Rescue Operations:</b> There is no centralized platform that can match available volunteers with 
distressed individuals based on proximity, resulting in uncoordinated and delayed rescue missions.
- <b>Dependence on Voice Calls:</b> Traditional reliance on voice calls for emergency reporting is not always feasible, 
particularly in situations where the individual is unable to speak or 
when lines are congested during large-scale emergencies.

<br>This project aims to address these issues by developing a Hazard Reporting System that uses SMS and text 
- parsed geo-location information to connect distressed individuals with the nearest volunteers, 
- enabling faster and more effective emergency responses across Bangladesh.<br>

### Project Overview
The Hazard Reporting System aims to create a robust, SMS-based solution for reporting flood related 
emergencies in Bangladesh. Leveraging the extensive network coverage of 
leading telcos like GP/Robi/Banglalink, 
this system will enable the distressed individuals to report incidents swiftly and effectively. 
The system will use geo-location data from external services to pinpoint the location of both the 
distressed person and available volunteers, facilitating prompt and coordinated rescue efforts.<br>

#### Project Objectives
- Rapid Incident Reporting: Provide a reliable platform for distressed individuals to report 
hazards via SMS to a dedicated short-code or long-code number.
- Accurate Geo-Location Tracking: Utilize the use of geo-location data from Offline GPS apps 
and Google Map API geocoding service to identify the exact location of the distressed person and nearby volunteers.
- Efficient Rescue Coordination: Enable real-time tracking of volunteers and connect them 
with distressed individuals based on proximity, enhancing the efficiency of rescue missions.
- Enhanced monitoring by a real-time GIS feature enabled Dashboard which will be utilized by 
trained volunteers or professionals from administration/defense/law enforcement department 
to coordinate the rescue missions.

### System Architecture

The followings are the main Components of this system:

- Live Dashboard for Incident & Volunteer monitoring
- Volunteer and Incident management database.
- Volunteer info management web portal.
- Web portal for Incident reporting and validation
- Back-end APIs for incident data and volunteer info integration.
- Background processes for automated volunteer-distress party matching.
- SMS servers provide by telco provider to integrate SMS data to the back-end.

<br>Here is a simplified diagram of the full system-

![Architecture Roadmap](https://github.com/skfarhad/hazard_reporting_system/blob/main/architecture_roadmap.jpg)

<br>The live dashboard will provide a birds-eye-view of the whole scenario
of the incidents reported and the rescue mission status.
Here is sample view of the live dashboard-

![Live Dashboard](https://github.com/skfarhad/hazard_reporting_system/blob/main/live_dashboard.jpeg)


### Tech Stack

Initial implementation for Back-End we are using 
[Python version 3.8](https://www.python.org/downloads/release/python-380/). 
The chosen back-end framework is [Django](https://www.djangoproject.com/). For background
processes, we are using [Celery](https://docs.celeryq.dev/). 
For live dashboard, [Next.js](https://nextjs.org/) is the frameworks being adopted initially. 
[PostgreSQL](https://www.postgresql.org/) is the database of choice for backend.
Docker and Kubernetes will be integrated as well.

![Tech stack](https://github.com/skfarhad/hazard_reporting_system/blob/main/HMS_tech_stack.jpg)

## If you want to contribute

Any contribution would be highly appreciated. Kindly go through the 
[guidelines for contributing](CONTRIBUTING.md).