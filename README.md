## Match modes

List of possible match modes :  

| Name        | alias | types                   | Description |
| :---------- | :---- | :---------------------- | :-------------------------------------------------------- |
| startsWith  |       | string                  | Whether the value starts with the filter value |
| contains	  |       | string                  | Whether the value contains the filter value |
| endsWith    |       | string                  | Whether the value ends with the filter value |
| notContains |       | string                  | Whether the value does not contain filter value |
| equals	  |       | string \| number        | Whether the value equals the filter value |
| notEquals	  |       | string \| number        | Whether the value does not equal the filter value |
| in	      |       | string[] \| number[]    | Whether the value contains the filter value |
| lt	      |       | string \| number        | Whether the value is less than the filter value |
| lte	      |       | string \| number        | Whether the value is less than or equals to the filter value |
| gt	      |       | string \| number        | Whether the value is greater than the filter value |
| gte	      |       | string \| number        | Whether the value is greater than or equals to the filter value |
| is	      |       | date \| boolean \| null | Whether the value equals the filter value, alias to equals |
| isNot	      |       | date \| boolean \| null | Whether the value does not equal the filter value, alias to notEquals |
| before      |       | date                    | Whether the date value is before the filter date |
| after	      |       | date                    | Whether the date value is after the filter date |
| between     |       | date[2] \| number[2]    | Whether the value is between the filter values | 
| st_contains |       | geometry                | Whether the geometry completely contains other geometries |
| st_dwithin  |       | geometry                | Whether geometries are within a specified distance from another geometry |

## Types

List of compatible match modes for each property types

| Name        | Match modes             |
| :---------- | :---------------------- | 
| string      | startsWith,<br>contains,<br>endsWith,<br>notContains,<br>equals,<br>notEquals,<br>lt,<br>lte,<br>gt,<br>gte |
| number      | equals,<br>notEquals,<br>lt,<br>lte,<br>gt,<br>gte |
| date        | is,<br>isNot,<br>before,<br>after |
| boolean     | is,<br>isNot            |
| string[]    | in                      |
| number[]    | in,<br>between          |
| date[]      | between                 |
| geometry    | st_contains,<br>st_dwithin |

List of secondary types : 

| Name               | equivalent |
| :----------------- | :--------- | 
| integer            | number     |
| float              | number     |
| even               | number     |
| odd                | number     |
| positive           | number     |
| negative           | number     |
| powerOfTwo         | number     |
| ascii              | number     |
| array              | any[]      |
| jwt                | string     |
| symbol             | string     |
| email              | string     |
| regex              | string     |
| ipAddress          | string     |
| slug               | string     |
| hexadecimal        | string     |
| date               | date       |
| timestamp          | date       |
| function           | string     |
| htmlElement        | string     |
| htmlEventAttribute | string     |
| node               | string     |
| json               | object     |
| object             | object     |