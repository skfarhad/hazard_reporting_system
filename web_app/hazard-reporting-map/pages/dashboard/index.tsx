import Container from "@/components/layouts/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InputWithButton from "@/components/ui/InputWithButton";
import { Cloud, Download, Search } from "lucide-react";
import React, { Fragment } from "react";
import { BsPersonPlus } from "react-icons/bs";
import data from "@/public/fake_incident_response.json";
import DataTable, { TDataTableColumn } from "@/components/DataTable";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Dashboard() {
  console.log(data);
  const columns: TDataTableColumn[] = [
    {
      title: "Name",
      width: "20px",
      selector: "name",
      hidden: false,
    },
    {
      title: "District",
      width: "40px",
      selector: "district",
    },
    {
      title: "Thana",
      selector: "thana",
    },
    {
      title: "Hazard Description",
      selector: "hazard_description",
    },
    {
      title: "LAT",
      selector: "lat",
    },
    {
      title: "LON",
      selector: "lon",
    },
  ];
  const loading = false;
  return (
    <div className="h-screen bg-paper/10">
      <div className="my-8">
        <Container>
          {/* filters */}
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <div className="">
                <InputWithButton
                  placeholder="Search.."
                  buttonNode={<Search size={16} />}
                />
              </div>
              <Button className=" gap-2">
                Download Csv{" "}
                <span>
                  <Download size={16} />
                </span>
              </Button>
            </div>
            <div className="flex gap-2">
              <Button className="gap-2">
                Upload CSV{" "}
                <span>
                  <Cloud size={16} />
                </span>
              </Button>
              <Button className="gap-2">
                Add User <BsPersonPlus />
              </Button>
            </div>
          </div>

          {/* data table */}
          <div className="mt-8 rounded-md bg-card px-4 py-8">
            <DataTable columns={columns} loading={false} data={data.data} />
          </div>
          <div className="bg-card flex justify-between px-4 py-8">
            <div className="flex items-center gap-4">
              <span>Show</span>
              <div className="w-[70px]">
                <Select>
                  <SelectTrigger>
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
                    <PaginationLink href="#">1</PaginationLink>
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
        </Container>
      </div>
    </div>
  );
}
