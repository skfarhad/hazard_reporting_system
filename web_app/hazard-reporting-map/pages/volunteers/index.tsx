import DataTable, { TDataTableColumn } from '@/components/DataTable';
import Container from '@/components/layouts/Container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

import { Input } from '@/components/ui/input';

import ClientComponent from '@/components/ClientComponent';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import data from '@/public/fake_incident_response.json';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Filter,
  Plus,
  Search,
  Trash,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import ReactPaginate from 'react-paginate';
import AddVolunteer from '@/components/modals/volunteers/AddVolunteer';

export default function Dashboard() {
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');
  const [district, setDistrict] = useState('');
  const [thana, setThana] = useState('');
  const [allData, setAllData] = useState(data.data);
  const [pageCount, setPageCount] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [openAddModal, setOpenAddModal] = useState(false);

  const columns: TDataTableColumn[] = [
    {
      header: () => <Checkbox />,
      type: 'action',
      cell: () => <Checkbox />,
    },
    {
      title: '#',
      cell: (row, i) => <span className="font-semibold">{i + 1}</span>,
      sortable: true,
    },
    {
      title: 'Contact',
      width: '20px',
      cell: (row) => (
        <div>
          <p className="font-semibold">{row.name}</p>
          <p>{row.contact}</p>
        </div>
      ),
      sortable: true,
      hidden: false,
    },
    {
      title: 'Description',
      selector: 'hazard_description',
    },

    {
      title: 'Status',
      width: '40px',
      cell: (row) => {
        if (row.status === 'active') {
          return <Badge>Active</Badge>;
        } else if (row.status === 'inactive') {
          return <Badge variant={'inactive'}>Inactive</Badge>;
        }
      },
    },
    {
      title: 'District',
      width: '40px',
      selector: 'district',
    },
    {
      title: 'Thana',
      selector: 'thana',
    },

    {
      title: 'Address',
      selector: 'address',
    },
    {
      title: 'Action',
      cell: () => (
        <div className="flex gap-4">
          <button>
            <Edit size={16} />
          </button>
          <button>
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const statusArr = ['All', 'Active', 'Inactive'];
  const districtsArr = ['Feni', 'Noakhali', 'Habiganj', 'MouloviBazar'];
  const thanaArr = ['Parshuram', 'Dighinala', 'Chandina'];
  const loading = false;
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    if (e.target.value.length > 0) {
      const filteredData = data.data.filter(
        (itm) =>
          itm.name.toLowerCase().includes(e.target.value.toLowerCase()) ||
          itm.address.toLowerCase().includes(e.target.value.toLowerCase())
      );
      setAllData(filteredData);
    } else {
      setAllData(data.data);
    }
  };

  const handlePagination = (page: Record<string, number>) => {
    setCurrentPage(page.selected + 1);
  };

  const handleStatus = (status: string) => {
    setStatus(status);
    if (status === 'All') {
      setAllData(data.data);
    } else {
      const filteredData = allData.filter(
        (itm) => itm.status.toLowerCase() === status.toLowerCase()
      );
      setAllData(filteredData);
    }
  };
  const handleDistrict = (district: string) => {
    setDistrict(district);
    const filteredData = data.data.filter(
      (itm) => itm.district.toLowerCase() === district.toLowerCase()
    );
    setAllData(filteredData);
  };
  const handleThana = (thana: string) => {
    setThana(thana);
    const filteredData = data.data.filter(
      (itm) => itm.thana.toLowerCase() === thana.toLowerCase()
    );
    setAllData(filteredData);
  };
  const count = Number(Math.ceil(data.data.length / 5));

  const indexOfLastData = currentPage * 5;
  const indexOfFirstData = indexOfLastData - 5;

  const dataSlice = allData.slice(indexOfFirstData, indexOfLastData);
  return (
    <ClientComponent>
      <div className="h-screen bg-paper/10">
        <div className="my-8">
          <Container>
            <div className="flex md:flex-row flex-col md:justify-between gap-4 md:gap-0 md:items-center pl-2 md:pl-0">
              <div className="font-semibold">
                <h2>All volunteers</h2>
              </div>
              <div className="flex gap-4">
                <AddVolunteer
                  open={openAddModal}
                  onOpenChange={setOpenAddModal}
                >
                  <Button
                    onClick={() => setOpenAddModal(!openAddModal)}
                    className="flex gap-2 text-xs px-6"
                  >
                    {' '}
                    <Plus size={16} /> Add volunteer
                  </Button>
                </AddVolunteer>
                <Button
                  variant={'destructive'}
                  className="flex gap-2 text-xs px-6"
                >
                  <Trash size={16} /> Remove volunteer
                </Button>
              </div>
            </div>
            {/* filters */}
            <div className="bg-secondary-background px-4 py-8 flex md:gap-24 gap-2 flex-wrap mt-3 rounded ">
              <div className="flex gap-4">
                <button className="border border-gray shadow-sm shadow-gray p-3 bg-primary-background rounded-md">
                  <Filter size={14} />
                </button>
                <Input
                  onChange={handleSearch}
                  placeholder="Search..."
                  value={searchInput}
                  icon={<Search size={16} />}
                />
              </div>
              <div className="flex gap-3 flex-wrap ">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    {' '}
                    <Button
                      className="gap-2 px-6 text-xs capitalize"
                      variant={'ghost'}
                      size={'sm'}
                    >
                      {status.length > 0 ? status : 'All'}{' '}
                      <ChevronDown size={10} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {statusArr.map((itm) => (
                      <DropdownMenuItem
                        key={itm}
                        onClick={() => handleStatus(itm)}
                      >
                        {itm}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger>
                    {' '}
                    <Button
                      className="gap-2 px-6 text-xs capitalize"
                      variant={'ghost'}
                      size={'sm'}
                    >
                      {district.length > 0 ? district : 'Feni'}{' '}
                      <ChevronDown size={10} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>District</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {districtsArr.map((itm) => (
                      <DropdownMenuItem
                        key={itm}
                        onClick={() => handleDistrict(itm)}
                      >
                        {itm}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger>
                    {' '}
                    <Button
                      className="gap-2 px-6 text-xs capitalize"
                      variant={'ghost'}
                      size={'sm'}
                    >
                      {thana.length > 0 ? thana : 'Thana'}{' '}
                      <ChevronDown size={10} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Thana</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {thanaArr.map((itm) => (
                      <DropdownMenuItem
                        key={itm}
                        onClick={() => handleThana(itm)}
                      >
                        {itm}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* data table */}
            <div className="rounded-md">
              <DataTable columns={columns} loading={false} data={dataSlice} />
            </div>
            {/* pagination */}
            <div className=" flex justify-center md:justify-end px-4 py-6 md:py-2 text-xs items-center mt-8  rounded ">
              <div className="">
                <ReactPaginate
                  previousLabel={
                    <ChevronLeft
                      size={16}
                      className="size-9 p-2 rounded font-semibold border border-gray"
                    />
                  }
                  nextLabel={
                    <ChevronRight
                      size={16}
                      className="size-9 p-2 rounded font-semibold border border-gray"
                    />
                  }
                  pageCount={count || 1}
                  activeClassName="border border-t-[#4200FF] border-r-[#4200FF] border-l-[#4200FF] border-b-[#4200FF] text-[#4200FF] font-semibold"
                  forcePage={currentPage !== 0 ? currentPage - 1 : 0}
                  onPageChange={(page) => handlePagination(page)}
                  pageClassName={
                    'rounded py-2 font-semibold border border-gray'
                  }
                  pageLinkClassName=" py-2 px-3.5 "
                  containerClassName={'flex items-center'}
                />
              </div>
            </div>
          </Container>
        </div>
      </div>
    </ClientComponent>
  );
}
