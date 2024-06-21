"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart, BarChartProps, PieChartProps, PieChart } from "@/lib/mui";
import { useEffect, useState } from "react";
import { useActions } from "@/utils/client";
import { EndpointsContext } from "./agent";
import { Order } from "./ai/schema";
import { LocalContext } from "../shared";
import { generateOrders } from "./generate-orders";
import { ChartType } from "./ai/graph";
import {
  FILTERS_MAP,
  constructStateBarChartProps,
  constructStatusPieChartProps,
  constructTotalAmountBarChartProps,
  constructTotalDiscountBarChartProps,
} from "./ai/filters";
import { XAxisFilter } from "./components/filter";

const SparklesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="black"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
    />
  </svg>
);

interface SmartFilterProps {
  onSubmit: (value: string) => Promise<void>;
  loading: boolean;
}

function SmartFilter(props: SmartFilterProps) {
  const [input, setInput] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await props.onSubmit(input);
    setInput("");
  };

  const ButtonContent = () => {
    if (props.loading) {
      return (
        <span className="flex items-center">
          <span className="mr-1">Loading</span>
          <span className="loading-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </span>
      );
    }
    return (
      <span className="flex flex-row gap-1 items-center">
        Submit <SparklesIcon />
      </span>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-row gap-1">
      <Input
        disabled={props.loading}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Magic filter"
      />
      <Button disabled={props.loading} type="submit" variant="outline">
        <ButtonContent />
      </Button>
    </form>
  );
}

const LOCAL_STORAGE_ORDERS_KEY = "orders";

export default function DynamicCharts() {
  const actions = useActions<typeof EndpointsContext>();
  const [loading, setLoading] = useState(false);
  const [elements, setElements] = useState<JSX.Element[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (orders.length > 0) {
      return;
    }
    const localStorageOrders = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    let ordersV: Order[] = [];
    if (!localStorageOrders || JSON.parse(localStorageOrders).length === 0) {
      const fakeOrders = generateOrders();
      ordersV = fakeOrders;
      setOrders(fakeOrders);
      localStorage.setItem(
        LOCAL_STORAGE_ORDERS_KEY,
        JSON.stringify(fakeOrders),
      );
    } else {
      ordersV = JSON.parse(localStorageOrders);
      setOrders(ordersV);
    }
    const chartProps = constructTotalAmountBarChartProps(ordersV);
    setElements([<BarChart {...chartProps} />]);
  }, []);

  const handleSubmitSmartFilter = async (input: string) => {
    setLoading(true);

    const element = await actions.filterGraph({
      input,
      orders,
    });

    // consume the value stream so we can be sure the graph has finished.
    (async () => {
      const lastEvent = await element.lastEvent;
      if (typeof lastEvent === "string") {
        throw new Error("lastEvent is a string. Something has gone wrong.");
      }
      console.log(lastEvent);
    })();

    setLoading(false);
    setElements([element.ui]);
  };

  const handleFilterXAxis = (key: string) => {
    switch (key) {
      case "totalAmount":
        return setElements([
          <BarChart {...constructTotalAmountBarChartProps(orders)} />,
        ]);
      case "state":
        return setElements([
          <BarChart {...constructStateBarChartProps(orders)} />,
        ]);
      case "totalDiscount":
        return setElements([
          <BarChart {...constructTotalDiscountBarChartProps(orders)} />,
        ]);
      case "status":
        return setElements([
          <PieChart {...constructStatusPieChartProps(orders)} />,
        ]);
      default:
        throw new Error("Invalid key");
    }
  };

  return (
    <div className="min-w-[80vw] mx-auto">
      <LocalContext.Provider value={handleSubmitSmartFilter}>
        <div className="flex flex-row w-full gap-1 items-center justify-center px-12">
          <XAxisFilter
            onFilter={handleFilterXAxis}
            keys={Object.keys(FILTERS_MAP)}
          />
          <div className="ml-auto w-[300px]">
            <SmartFilter loading={loading} onSubmit={handleSubmitSmartFilter} />
          </div>
        </div>
        <div className="w-3xl h-[500px]">{elements}</div>
      </LocalContext.Provider>
    </div>
  );
}
