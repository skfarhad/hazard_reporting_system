from pharser import pharse_full, pharse_location

if __name__ == '__main__':
    message = ['Feni#Parshuram#Govt. Primary School#Need Energrncy Medicine : Paracetamol',
               'Chottogram#Kotuali#Kotuali#Need Energrncy Medicine : Paracetamol']
    for m in message:
        print(pharse_full(m))
        print(pharse_location(m))