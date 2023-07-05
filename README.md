# Obsidian Periodic PARA

This is a plugin for [LifeOS](https://sspai.com/post/80802), which assist in practicing the PARA system with periodic notes.

## Installation

#### Recommended
Periodic PARA is available in the Obsidian community plugin browser.

#### Manual
Go to the [releases](https://github.com/quanru/obsidian-periodic-para/releases) and download the latest `main.js` and `manifest.json` files. Create a folder called `periodic-para` inside `.obsidian/plugins` and place both files in it.

## Settings
Configuration not yet supported, will be supported later.

## Usage

### query code block

Periodic PARA works by writing markdown code block, which query project, area, task list according to the date parsed from current filename.

#### query tasks by done date

~~~markdown
```periodic-para
TaskDoneList
```
~~~

#### query tasks by record date

~~~markdown
```periodic-para
TaskRecordList
```
~~~

#### query projects by current date

~~~markdown
```periodic-para
ProjectList
```
~~~

#### query areas by current date

~~~markdown
```periodic-para
AreaList
```
~~~

### [templater](https://github.com/SilentVoid13/Templater) helpers

#### Generate list

Generate a list of README.md snapshots in the specified directory.

~~~markdown
<% PeriodicPARA.File.list('1. Projects') %>
~~~

to

~~~markdown
1. [[1. Projects/x-project/README|x-project]]
2. [[1. Projects/y-project/README|y-project]]
~~~

## example

![](assets/periodic-para-plugin.png)
