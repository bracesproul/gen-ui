import { PieChartProps, BarChartProps, BarSeriesType } from "@/lib/mui";
import { Order } from "./schema";

/**
 * Copied from MUI since it is not exported.
 */
export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

export const FILTERS_MAP: Record<
  string,
  MakeOptional<BarSeriesType, "type">[]
> = {
  totalAmount: [
    {
      /**
       * Horizontal bar chart where each group is a product,
       * and the value is the total number of orders for that product.
       */
      dataKey: "totalAmount",
      label: "Total orders",
      // valueFormatter: (value: number | null) => `$${value?.toLocaleString()}`,
    },
  ],
  state: [
    {
      /**
       * Bar chart with the x axis being the total number of orders
       * for a given state, and the y axis being the state.
       */
      dataKey: "state",
      label: "Purchase state",
      // valueFormatter: (value: number | null) => `$${value?.toLocaleString()}`,
    },
  ],
  status: [
    {
      /**
       * Bar chart where each item is a product, broken down by
       * order status (color coded)
       */
      dataKey: "status",
      label: "Status of the order",
      // valueFormatter: (value: number | null) => `$${value?.toLocaleString()}`,
    },
  ],
  totalDiscount: [
    {
      /**
       * Bar chart which shows the total amount of discounts
       * applied to each product.
       */
      dataKey: "totalDiscount",
      label: "The total discounts given by product",
      // valueFormatter: (value: number | null) => `$${value?.toLocaleString()}`,
    },
  ],
};

export function constructTotalAmountBarChartProps(
  orders: Order[],
): BarChartProps {
  const sortedByNames = orders.reduce(
    (acc, order) => {
      if (!acc[order.productName]) {
        acc[order.productName] = [];
      }
      acc[order.productName].push(order);
      return acc;
    },
    {} as Record<string, Order[]>,
  );
  const ordersByProduct = Object.entries(sortedByNames)
    .map(([name, orders]) => {
      const totalOrderAmount = orders.reduce(
        (acc, order) => acc + order.amount,
        0,
      );
      return { name, totalAmount: totalOrderAmount };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount);
  return {
    yAxis: [{ scaleType: "band", dataKey: "name" }],
    series: FILTERS_MAP.totalAmount,
    layout: "horizontal",
    dataset: ordersByProduct,
  };
}

export function constructStateBarChartProps(orders: Order[]): BarChartProps {
  const sortedByState = orders.reduce(
    (acc, order) => {
      if (!acc[order.address.state]) {
        acc[order.address.state] = [];
      }
      acc[order.address.state].push(order);
      return acc;
    },
    {} as Record<string, Order[]>,
  );
  const ordersByState = Object.entries(sortedByState)
    .map(([state, orders]) => {
      const totalOrderAmount = orders.reduce(
        (acc, order) => acc + order.amount,
        0,
      );
      return { state, totalAmount: totalOrderAmount };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount);
  return {
    yAxis: [{ scaleType: "band", dataKey: "state" }],
    series: FILTERS_MAP.totalAmount,
    layout: "horizontal",
    dataset: ordersByState,
  };
}

export function constructTotalDiscountBarChartProps(
  orders: Order[],
): BarChartProps {
  const sortedByNamesTotalDiscount = orders.reduce(
    (acc, order) => {
      if (!acc[order.productName]) {
        acc[order.productName] = [];
      }
      acc[order.productName].push(order);
      return acc;
    },
    {} as Record<string, Order[]>,
  );
  const seriesTotalDiscount = Object.entries(sortedByNamesTotalDiscount)
    .map(([name, ordersByProduct]) => {
      const totalDiscount = ordersByProduct.reduce((acc, o) => {
        if (!o.discount) {
          return acc;
        }
        const discountValue = o.amount * (o.discount / 100);
        return acc + discountValue;
      }, 0);
      const totalOrderAmount = ordersByProduct.reduce(
        (acc, o) => acc + o.amount,
        0,
      );
      const discountAsPercentage = (totalDiscount / totalOrderAmount) * 100;
      return [
        {
          data: [discountAsPercentage],
          stack: name,
          label: `${name} (discount)`,
        },
        {
          data: [100 - discountAsPercentage],
          stack: name,
          label: `${name} (rest)`,
        },
      ];
    })
    .flat();

  return {
    series: seriesTotalDiscount,
  };
}

export function constructStatusPieChartProps(orders: Order[]): PieChartProps {
  const totalOrdersForEachStatus = orders.reduce(
    (acc, o) => {
      if (!acc[o.status]) {
        acc[o.status] = 1;
      }
      acc[o.status] += 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const seriesStatus = Object.entries(totalOrdersForEachStatus).map(
    ([status, count], idx) => ({
      id: idx,
      value: count,
      label: status,
    }),
  );

  return {
    series: [
      {
        data: seriesStatus,
      },
    ],
  };
}
