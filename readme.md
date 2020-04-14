# iotes

**A javascript library for intergrating iot services with modern front end state management tools** 

[![npm version](https://badge.fury.io/js/iotes.svg)](https://badge.fury.io/js/iotes)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/seamusfoley/iotes/master/LICENSE)
![Build](https://github.com/seamusfoley/iotes/workflows/iotes-npm-deploy/badge.svg?branch=master)

## Table of Contents
- [iotes](#iotes)
  - [Table of Contents](#table-of-contents)
  - [Work in progess](#work-in-progess)
  - [We the Curious](#we-the-curious)
  - [Getting Started](#getting-started)
    - [Introduction to iotes](#introduction-to-iotes)
    - [General Design](#general-design)
    - [Installation](#installation)
    - [Using iotes](#using-iotes)
- [Contribution](#contribution)
  - [MIT License](#mit-license)

## Work in progess

Note that this is very much a work in progress at this stage and not suitable for general use

## We the Curious

This is designed to be developed to replace the ifs-brightsignmiddleware-redux

## Getting Started


### Introduction to iotes

Modern front end libraries lean heavily on a declaritive approach to state management where interfaces which which react to updating state object or objects. This intergrates naturally well with REST or graphql services where new state is delivered on request, but requires some more thought for iot applications where the connection to a service is generally stateful, ie the connection remains open and the data is streamed in as and when it arrives. 

One solution is to allow front end component to subscribe to a stream of data from the iot device which remains open for the life time of the application. This 'device stream' only updates when new data is received, unaffected by the underlying connection status of the iot service allowing the front end component to listen to state updates and react in the usual way. 

However this means no connection information is provided on that stream. If a connection is never established because the remote iot service is unavaliable for example then no data will appear on the the device stream and the front end will appear unresponsive. 

In order to receive updates fromt the iot host (such as an mqtt broker), a host stream can be established in the same manner which is dedicted to connection status allowing components to react to connection status. Keeping the host stream seperate form the device stream allows different treatment of the connection state which can be convienient for analytics or debugging.

The iotes library provides an abstraction to create the host stream and the device stream for different connection strategies, and plugins for extra compatibility with different front end frameworks.

### General Design

iotes is deigned to a be a generic middleware to sit between a state management library (via a plugin) and iot api (via a strategy). It can operate without a plugin but must have a strategy in order to function.

Iotes works on an observable pattern, On initialization iotes creates two stores which handle `subscribers` (functions which are notified of store changes) and `dispatchers` (functions which update the store).

The two stores are the 

 - host store : for system events like connections, disconnections etc
 - device store: which is reserved one for data from the the iot devices. 

```

                ----------                      -----------                      -------------   
                |        |   -- dispatch -->    |         |   -- subscribe -->   |           |
    State <---> | Plugin |                      |  iotes  |                      | Strategy  |  <---> Network
                |        |   <-- subscribe --   |         |   <-- dispatch --    |           |
                ----------                      -----------                      -------------

```

### Installation

iotes is available as an [npm package](https://npmjs.org/package/iotes).

itoes strategies and plugins are avaliable as serperate npm packages, their names being with iotes-*

Install iotes locally via npm:

```bash
npm install iotes
```

To form a connection to an iot service you will need a connection strategy. This is to install a basic mqtt strategy.

```bash
npm install iotes-strategy-mqtt
```

~~A full list of strategies is avaliable [here](nolink)~~

There may also be an existing plugin avaliable for your front end framework, or you can write your own

```bash
npm install iotes-react-hooks
```

~~A full list of plugins is avaliable [here](nolink)~~

iotes is written in typescript and comes with full type declarations


### Using iotes

a new iotes instances is created by using the createIotes function, with your system topology declared,
more information can be found about system topolgy map can be found her here.

Each iotes instance may hande connection to multiple hosts, but only on strategy can be used per instance. 

iotes returns for functions for receiving and sending messages using the iotes host and device streams

```ts
    {
        hostSubscribe: (selector: (state) => state)
        hostDispatch: (hostDispatacble: HostDispatchable)
        deviceSubscribe: (selector: (state) => state)
        deviceDisptach: (hostDispatcable: HostDispatchable)
    }
```

The topology map is the main thing would need to supply. The topology map takes two arrays. An array of hosts and the devices

What a host is depends on the strategy, in the case of mqtt for example the host refers to the mqtt broker. In the case of the a phdiget it is a hub.

The devices are connected to the host by the hostName field in the device config. They will be connected to the correct host on iotes initialization.

```js
import { createIotes } from 'iotes'
import { createMqttStrategy } from 'iotes-mqtt-strategy'

const topologyMap= {
    client: {name: 'test app'} 
    hosts: [
        host: 'ws://127.0.0.1', 
        port: '1883', 
        name: 'mqttExample', 
        strategyConfig: {} 
    ],
    devices: [
        hostName: 'mqttExample',
        name 'deviceExample',
    ]
}

const { 
    hostSubscribe,
    hostDispatch,
    deviceSubscribe,
    deviceDisptach   
} = createItoes(topologyMap, createMqttStrategy)

hostSubscribe((state) => console.log(state))
```

<details>
<summary>
Click here to view example typescript implementation
</summary>
<p>

```ts
import { createIotes, Iotes, TopologyMap, State } from 'iotes'
import { createMqttStrategy } from 'iotes-mqtt-strategy'

const topologyMap: TopologyMap = {
    hosts: [
        host: 'ws://127.0.0.1', 
        port: '1883', 
        name: 'mqttExample', 
        strategyConfig: {} 
    ],
    devices: [
        hostName: 'mqttExample',
        name 'deviceExample',

    ]
}

const { 
    hostSubscribe,
    hostDispatch,
    deviceSubscribe,
    deviceDisptach   
}: Iotes = createItoes(topologyMap, createMqttStrategy)


hostSubscribe((state: State) => console.log(state))

```


</p>
</details>

# Contribution

iotes is under constant development, and has several important issues still open.
to see where we are in the development, picked an issue of your taste and gave us a hand.

If you would like to see a feature implemented or want to contribute a new
feature, you are welcome to open an issue to discuss it and we will be more than
happy to help.

If you choose to make a contribution, please fork this repository, work on a
feature and submit a pull request.

MIT License
----

Copyright (c) 2020 Seamus Foley

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

