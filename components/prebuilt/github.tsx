import {
  CircleIcon,
  StarIcon,
} from "@radix-ui/react-icons"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface DemoGithubProps {
  owner: string
  repo: string
  description: string
  stars: number
  language: string
}

export function DemoGithub(props: DemoGithubProps) {
  return (
    <Card>
      <CardHeader className="grid grid-cols-[1fr_110px] items-start gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle>{props.owner}/{props.repo}</CardTitle>
          <CardDescription>
          {props.description}
          </CardDescription>
        </div>
        <div className="flex items-center space-x-1 rounded-md bg-secondary text-secondary-foreground">
          <Button onClick={() => {
            window.location.href = `https://github.com/${props.owner}/${props.repo}`;
          }} variant="secondary" className="px-3 shadow-none">
            <StarIcon className="mr-2 h-4 w-4" />
            Star
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <CircleIcon className="mr-1 h-3 w-3 fill-sky-400 text-sky-400" />
            {props.language}
          </div>
          <div className="flex items-center">
            <StarIcon className="mr-1 h-3 w-3" />
            {props.stars}
          </div>
          <div>Updated {new Date().getMonth()} {new Date().getFullYear()}</div>
        </div>
      </CardContent>
    </Card>
  )
}