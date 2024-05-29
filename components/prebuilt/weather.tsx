import { Card } from "../ui/card";
import { format } from "date-fns";
import { Progress } from "../ui/progress";

export interface CurrentWeatherProps {
  temperature: number;
  high: number;
  low: number;
  city: string;
  state: string;
}

export function CurrentWeather(props: CurrentWeatherProps) {
  const currentTime = format(new Date(), "hh:mm:ss a");
  const currentDay = new Date().getDay();
  // assume the maximum temperature is 130 and the minium is -20
  const weatherAsPercentage = (props.temperature + 20) / 150;
  return (
    <Card className="w-full max-w-md">
      <div className="w-full flex flex-row justify-between">
        <p>{currentDay}</p>
        <p>{currentTime}</p>
      </div>
      <div className="flex justify-start">
        <p>
          {props.city}, {props.state}
        </p>
      </div>
      <div className="flex items-center justify-center w-full">
        <p className="text-[56px] font-bold">{props.temperature}%deg;</p>
      </div>
      <div className="flex justify-center">
        <Progress aria-label="Temperature" value={weatherAsPercentage} />
      </div>
    </Card>
  );
}
