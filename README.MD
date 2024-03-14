# External sorting CLI

This is a NodeJS CLI for file external sorting.

> External sorting is a class of sorting algorithms that can handle massive amounts of data. External sorting is required when the data being sorted do not fit into the main memory of a computing device (usually RAM) and instead they must reside in the slower external memory, usually a disk drive. Thus, external sorting algorithms are external memory algorithms and thus applicable in the external memory model of computation.

## Installing

```
npm install
```

## Building

```
npm run build
```

## Running

```
node cli.js -i bigfile.txt -o bigfile-sorted.txt -d tmp -m 256000
```

```
Required Arguments:
  -i path to input file to be sorted
  -o path to output file to be created
  -d intermediate directory for partition (must be an existing)
  -m partition size
```

## Testing

```
TDB
```

## Limitations

* Supports only UTF-8 encoded files
* Partition size (aka maximum memory usage) sshould be specified taking into account nodejs overhead (sadly)