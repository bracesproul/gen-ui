import { z } from "zod";
import { RunnableConfig } from "@langchain/core/runnables";
import { StateGraph, START, END } from "@langchain/langgraph";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { Filter, Order, filterSchema } from "./schema";
import { BarChart, BarChartProps, PieChart, PieChartProps } from "@/lib/mui";
import {
  constructStateBarChartProps,
  constructStatusPieChartProps,
  constructTotalAmountBarChartProps,
  constructTotalDiscountBarChartProps,
} from "./filters";
import { format } from "date-fns";
import { FilterButton } from "../components/filter";
import { LoadingBarChart, LoadingPieChart } from "../components/loading";
import { createRunnableUI } from "@/utils/server";
import { createStreamableUI } from "ai/rsc";

export type ChartType = "bar" | "line" | "pie";

interface AgentExecutorState {
  input: string;
  /**
   * All orders to filter by.
   */
  orders: Order[];
  /**
   * The LLM generated filters based on the user input.
   */
  selectedFilters?: Filter;
  /**
   * The type of chart to display the data.
   */
  chartType?: ChartType;
  /**
   * The format to display the data in.
   */
  displayFormat?: string;
  /**
   * The props to pass to the chart component.
   */
  props?: BarChartProps | Record<string, any>;
  /**
   * The UI stream for adding elements to the page.
   */
  ui: ReturnType<typeof createStreamableUI>;
}

type DataDisplayTypeAndDescription = {
  /**
   * The name of the data display type.
   */
  name: string;
  /**
   * The type of chart which this format can be displayed on.
   */
  chartType: ChartType;
  /**
   * The description of the data display type.
   */
  description: string;
  /**
   * The function to use to construct the props for the chart.
   */
  propsFunction?: (orders: Order[]) => BarChartProps | PieChartProps;
};

const DATA_DISPLAY_TYPES_AND_DESCRIPTIONS_MAP: {
  [name: string]: DataDisplayTypeAndDescription;
} = {
  totalAmount: {
    name: "totalAmount",
    description:
      "Sort by total dollar amount of orders, grouping by product name.",
    chartType: "bar",
    propsFunction: constructTotalAmountBarChartProps,
  },
  state: {
    name: "state",
    description:
      "Sort by total dollar amount of orders, grouping by the state the order was shipped to.",
    chartType: "bar",
    propsFunction: constructStateBarChartProps,
  },
  totalDiscount: {
    name: "totalDiscount",
    description:
      "Show the percentage of total order amount that was discounted, and the remaining percentage that was not discounted. Group by product name.",
    chartType: "bar",
    propsFunction: constructTotalDiscountBarChartProps,
  },
  status: {
    name: "status",
    description:
      "Show the percentage of orders in each status, grouping by order status.",
    chartType: "pie",
    propsFunction: constructStatusPieChartProps,
  },
};

const formatDataDisplayTypesAndDescriptions = (
  dataDisplayTypesAndDescriptions: Array<DataDisplayTypeAndDescription>,
) =>
  dataDisplayTypesAndDescriptions.map(
    ({ name, description, chartType }) =>
      `Data display type: ${name}. Chart type: ${chartType}. Description: ${description}`,
  );

export function graphAgentExecutor() {
  const agent = new AgentExecutorGraph();
  const workflow = new StateGraph<AgentExecutorState>({
    channels: {
      input: null,
      orders: null,
      selectedFilters: null,
      chartType: null,
      displayFormat: null,
      props: null,
      ui: null,
    },
  })
    .addNode("generateFilters", agent.generateFilters.bind(agent)) // Generate the filters
    .addNode("generateChartType", agent.generateChartType.bind(agent)) // Generate the type of chart to display the data
    .addNode(
      "generateDataDisplayFormat",
      agent.generateDataDisplayFormat.bind(agent),
    ) // Generate the format to display the data
    .addNode("filterData", agent.filterData.bind(agent)) // Perform the data filtering
    .addNode("constructChartProps", agent.constructChartProps.bind(agent)) // Construct the props for the chart
    .addEdge(START, "generateFilters")
    .addEdge("generateFilters", "generateChartType")
    .addEdge("generateChartType", "generateDataDisplayFormat")
    .addEdge("generateDataDisplayFormat", "filterData")
    .addEdge("filterData", "constructChartProps")
    .addEdge("constructChartProps", END);

  const graph = workflow.compile();
  return graph;
}

class AgentExecutorGraph {
  ui: ReturnType<typeof createStreamableUI> | undefined = undefined;

  config: RunnableConfig | undefined = undefined;

  async getUi(config?: RunnableConfig) {
    if (!this.ui) {
      this.ui = await createRunnableUI(config);
      return this.ui;
    } else {
      return this.ui;
    }
  }

  async constructChartProps(
    state: AgentExecutorState,
    config?: RunnableConfig,
  ): Promise<Partial<AgentExecutorState>> {
    if (!state.chartType) {
      throw new Error("ChartType is required to filter data.");
    } else if (!state.displayFormat) {
      throw new Error("DisplayFormat is required to filter data.");
    }

    const displayDataObj =
      DATA_DISPLAY_TYPES_AND_DESCRIPTIONS_MAP[state.displayFormat];
    if (!displayDataObj?.propsFunction) {
      throw new Error(
        `No props function found for display format: ${state.displayFormat} and chart type: ${state.chartType}`,
      );
    }
    const props = displayDataObj.propsFunction(state.orders);
    const ui = await this.getUi();
    if (state.chartType === "bar") {
      ui.update(<BarChart {...(props as BarChartProps)} />);
    } else if (state.chartType === "pie") {
      ui.update(<PieChart {...(props as PieChartProps)} />);
    }
    ui.done();

    return {
      props,
    };
  }

  async filterData(
    state: AgentExecutorState,
  ): Promise<Partial<AgentExecutorState>> {
    if (!state.selectedFilters) {
      throw new Error("Can not filter orders without selected filters.");
    }

    const {
      productNames,
      beforeDate,
      afterDate,
      minAmount,
      maxAmount,
      state: orderState,
      city,
      discount,
      minDiscountPercentage,
      status,
    } = state.selectedFilters;

    if (minDiscountPercentage !== undefined && discount === false) {
      throw new Error(
        "Can not filter by minDiscountPercentage when discount is false.",
      );
    }

    let filteredOrders = state.orders.filter((order) => {
      let isMatch = true;

      if (
        productNames &&
        !productNames.includes(order.productName.toLowerCase())
      ) {
        isMatch = false;
      }

      if (beforeDate && order.orderedAt > beforeDate) {
        isMatch = false;
      }
      if (afterDate && order.orderedAt < afterDate) {
        isMatch = false;
      }
      if (minAmount && order.amount < minAmount) {
        isMatch = false;
      }
      if (maxAmount && order.amount > maxAmount) {
        isMatch = false;
      }
      if (
        orderState &&
        order.address.state.toLowerCase() !== orderState.toLowerCase()
      ) {
        isMatch = false;
      }
      if (city && order.address.city.toLowerCase() !== city.toLowerCase()) {
        isMatch = false;
      }
      if (
        discount !== undefined &&
        (order.discount === undefined) !== discount
      ) {
        isMatch = false;
      }
      if (
        minDiscountPercentage !== undefined &&
        (order.discount === undefined || order.discount < minDiscountPercentage)
      ) {
        isMatch = false;
      }
      if (status && order.status.toLowerCase() !== status) {
        isMatch = false;
      }

      return isMatch;
    });

    return {
      orders: filteredOrders,
    };
  }

  async generateDataDisplayFormat(
    state: AgentExecutorState,
    config?: RunnableConfig,
  ): Promise<Partial<AgentExecutorState>> {
    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are an expert data analyst. Your task is to determine the best format to display the data based on the filters, chart type and user input.
  
  The type of chart which the data will be displayed on is: {chartType}.
  
  This chart has the following formats of which it can display the data: {dataDisplayTypesAndDescriptions}.
  
  The user will provide you with their original input to the 'magic filter' prompt, and the filters which have been generated based on their input.
  You should use these inputs as context when making a decision on the best format to display the data.
  
  Select the best display format to show the data based on the filters, chart type and user input.
  `,
      ],
      [
        "human",
        `Magic filter input: {magicFilterInput}
  
  Generated filters: {selectedFilters}`,
      ],
    ]);
    const filterSchema = z
      .object({
        displayFormat: z
          .enum([
            Object.values(DATA_DISPLAY_TYPES_AND_DESCRIPTIONS_MAP)[0].name,
            ...Object.values(DATA_DISPLAY_TYPES_AND_DESCRIPTIONS_MAP)
              .slice(1)
              .map(({ name }) => name),
          ])
          .describe("The format to display the data in."),
      })
      .describe(
        "Choose the best format to display the data based on the filters and chart type.",
      );
    const model = new ChatOpenAI({
      model: "gpt-4-turbo",
      temperature: 0,
    }).withStructuredOutput(filterSchema, {
      name: "data_display_format",
    });

    const chain = prompt.pipe(model);
    const result = await chain.invoke(
      {
        chartType: state.chartType,
        magicFilterInput: state.input,
        selectedFilters: state.selectedFilters,
        dataDisplayTypesAndDescriptions: formatDataDisplayTypesAndDescriptions(
          Object.values(DATA_DISPLAY_TYPES_AND_DESCRIPTIONS_MAP),
        ),
      },
      config,
    );
    return result;
  }

  async generateChartType(
    state: AgentExecutorState,
    config?: RunnableConfig,
  ): Promise<Partial<AgentExecutorState>> {
    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are an expert data analyst. Your task is to determine the best type of chart to display the data based on the filters and user input.
  You are provided with three chart types: 'bar', 'line', and 'pie'.
  The data which is being filtered is a set of orders from an online store.
  The user has submitted an input that describes the filters they'd like to apply to the data.
  
  Keep in mind that each chart type has set formats to display the data. You should consider the best display format when selecting your chart type.
  
  Data display types: {dataDisplayTypesAndDescriptions}
  
  Based on their input and the filters that have been generated, select the best type of chart to display the data.`,
      ],
      [
        "human",
        `Magic filter input: {magicFilterInput}
  
  Generated filters: {selectedFilters}`,
      ],
    ]);
    const filterSchema = z
      .object({
        chartType: z
          // .enum(["bar", "line", "pie"])
          .enum(["bar", "pie"])
          .describe("The type of chart to display the data."),
      })
      .describe(
        "Choose the best type of chart to display the data, based on the filters, user request, and ways to display the data on a given chart.",
      );
    const model = new ChatOpenAI({
      model: "gpt-4-turbo",
      temperature: 0,
    }).withStructuredOutput(filterSchema, {
      name: "chart_type",
    });

    const chain = prompt.pipe(model);
    const result = await chain.invoke(
      {
        magicFilterInput: state.input,
        selectedFilters: state.selectedFilters,
        dataDisplayTypesAndDescriptions: formatDataDisplayTypesAndDescriptions(
          Object.values(DATA_DISPLAY_TYPES_AND_DESCRIPTIONS_MAP),
        ),
      },
      config,
    );
    const ui = await this.getUi();

    if (result.chartType === "bar") {
      ui.append(<LoadingBarChart />);
    } else if (result.chartType === "pie") {
      ui.append(<LoadingPieChart />);
    }

    return result;
  }

  async generateFilters(
    state: AgentExecutorState,
    config?: RunnableConfig,
  ): Promise<Partial<AgentExecutorState>> {
    if (!config) {
      throw new Error("Config is required to generate the chart");
    }

    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are a helpful assistant. Your task is to determine the proper filters to apply, give a user input.
  The user input is in response to a 'magic filter' prompt. They expect their natural language description of the filters to be converted into a structured query.`,
      ],
      ["human", "{input}"],
    ]);

    const productNames = Array.from(
      new Set(state.orders.map((order) => order.productName.toLowerCase())),
    );
    const schema = filterSchema(productNames);

    const model = new ChatOpenAI({
      model: "gpt-4-turbo",
      temperature: 0,
    }).withStructuredOutput(schema, {
      name: "generate_filters",
    });
    const chain = prompt.pipe(model);
    const result = await chain.invoke(
      {
        input: state.input,
      },
      config,
    );

    const filtersWithValues: Partial<Filter> = Object.fromEntries(
      Object.entries(result).filter(([key, value]) => {
        return value !== undefined && key in result;
      }),
    );
    const filterButtons = Object.entries(filtersWithValues).flatMap(
      ([key, value]) => {
        if (["string", "number"].includes(typeof value)) {
          return (
            <FilterButton
              key={key}
              filterKey={key}
              filterValue={value as string | number}
            />
          );
        } else if (Array.isArray(value)) {
          const values = value.join(", ");
          return (
            <FilterButton key={key} filterKey={key} filterValue={values} />
          );
        } else if (typeof value === "object") {
          const formattedDate = format(new Date(value), "yyyy-MM-dd");
          return (
            <FilterButton
              key={key}
              filterKey={key}
              filterValue={formattedDate}
            />
          );
        } else if (typeof value === "boolean") {
          return (
            <FilterButton
              key={key}
              filterKey={key}
              filterValue={value ? "true" : "false"}
            />
          );
        }
        return [];
      },
    );
    const buttonsDiv = (
      <div className="flex flex-wrap gap-2">{filterButtons}</div>
    );
    const ui = await this.getUi(config);
    ui.update(buttonsDiv);

    return {
      selectedFilters: result,
    };
  }
}
