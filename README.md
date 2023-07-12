# Obsidian Periodic PARA

- This is a plugin for [LifeOS](https://quanru.github.io/2023/07/08/Building%20my%20second%20brain%20%F0%9F%A7%A0%20with%20Obsidian/), which assist in practicing the PARA system with periodic notes.
- You can download the [LifeOS-example](https://github.com/quanru/obsidian-example-LifeOS) to experience it.

## Installation

> [Dataview](https://github.com/blacksmithgu/obsidian-dataview) is required, please install it first.

#### BRAT
Periodic PARA has not been available in the Obsidian community plugin browser, but I already submitted it for [review](https://github.com/obsidianmd/obsidian-releases/pull/2117). You can install it by [BRAT](https://github.com/TfTHacker/obsidian42-brat).

#### Manual
Go to the [releases](https://github.com/quanru/obsidian-periodic-para/releases) and download the latest `main.js` and `manifest.json` files. Create a folder called `periodic-para` inside `.obsidian/plugins` and place both files in it.

## Settings
Configuration not yet supported, will be supported later.

## Usage

### query code block

Periodic PARA works by writing markdown code block, which query project, area, task list according to the date parsed from current filename.

#### query by time

~~~markdown
```PeriodicPARA
TaskDoneListByTime
```
~~~


~~~markdown
```PeriodicPARA
TaskRecordListByTime
```
~~~


~~~markdown
```PeriodicPARA
ProjectListByTime
```
~~~

~~~markdown
```PeriodicPARA
AreaListByTime
```
~~~

#### query by tag

~~~markdown
```PeriodicPARA
TaskListByTag
```
~~~

~~~markdown
```PeriodicPARA
BulletListByTag
```
~~~

#### query para by folder

~~~markdown
```PeriodicPARA
ProjectListByFolder
```
~~~

~~~markdown
```PeriodicPARA
AreaListByFolder
```
~~~

~~~markdown
```PeriodicPARA
ResourceListByFolder
```
~~~

~~~markdown
```PeriodicPARA
ArchiveListByFolder
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


## next
- [ ] Supports custom directories
  - PARA directories
  - Periodic directories