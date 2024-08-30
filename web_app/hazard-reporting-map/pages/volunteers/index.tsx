import DataTable, { TDataTableColumn } from '@/components/DataTable';
import Container from '@/components/layouts/Container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import data from '@/public/fake_incident_response.json';
import { Edit, Filter, Plus, Search, Trash, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const columns: TDataTableColumn[] = [
    {
      header: () => <Checkbox />,
      cell: () => <Checkbox />,
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
      hidden: false,
    },
    {
      title: 'Short Biography',
      selector: 'hazard_description',
    },
    {
      title: 'Active Status',
      width: '40px',
      cell: () => <Badge>active</Badge>,
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
      title: 'Latitude',
      selector: 'lat',
    },
    {
      title: 'Longitude',
      selector: 'lon',
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
  const loading = false;
  return (
    <div className="h-screen bg-paper/10">
      <div className="my-8">
        <Container>
          <div className="flex justify-end gap-4 items-center">
            <Button size={'sm'} className="flex gap-2">
              {' '}
              <Plus size={16} /> Add volunteer
            </Button>
            <Button size={'sm'} variant={'destructive'} className="flex gap-2">
              <Trash size={16} /> Bulk Delete
            </Button>
          </div>
          {/* filters */}
          <div className="bg-table-header-bg px-4 py-8 flex md:gap-8 gap-2 flex-wrap">
            <div className="flex gap-4">
              <button className="border border-gray shadow-sm shadow-gray p-3 bg-primary-background rounded-md">
                <Filter size={16} />
              </button>
              <Input placeholder="Search..." icon={<Search size={16} />} />
            </div>
            <div className="flex gap-3">
              <Button variant={'ghost'} size={'sm'}>
                Active
              </Button>
              <Button variant={'ghost'} size={'sm'}>
                Feni
              </Button>
              <Button variant={'ghost'} size={'sm'}>
                All thana
              </Button>
            </div>
          </div>

          {/* data table */}
          <div className="rounded-md">
            <DataTable columns={columns} loading={false} data={data.data} />
          </div>
          <div className="bg-table-header-bg flex flex-col md:gap-0 justify-between px-4 py-6 md:py-2 text-xs items-center mt-8 md:flex-row gap-4">
            <div>
              <span>1-10 of 100</span>
            </div>
            <div className="flex md:flex-row  flex-col gap-4">
              <div className="flex items-center gap-4">
                <span>Show</span>
                <div className="w-[70px]">
                  <Select>
                    <SelectTrigger className="h-5 py-4">
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <span>Results</span>
              </div>
              <div className="">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink size={'sm'} href="#">
                        1
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext href="#" />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}
