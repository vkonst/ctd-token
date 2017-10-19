#!/usr/bin/env bash

preStart=`date -d 'Fri Oct 20 00:00:00 CEST 2017' +%s`;
echo "preICO starts: $preStart (`date -d @$preStart`)"  # preICO starts: 1508450400 (Fri 20 Oct 00:00:00 CEST 2017)

icoStart=`date -d 'Mon Nov 20 00:00:00 CET 2017' +%s`;
echo "ICO starts at: $icoStart (`date -d @$icoStart`)"  # ICO starts at: 1511132400 (Mon 20 Nov 00:00:00 CET 2017)

icoEnd=`date -d 'Wed Feb 28 23:59:00 CET 2018' +%s`;
echo "ICO ends at: $icoEnd (`date -d @$icoEnd`)"        # ICO ends at: 1519858740 (Wed 28 Feb 23:59:00 CET 2018)

preDuration=`echo "$icoStart - $preStart" | bc`;
echo "preDuration $preDuration"                         # preDuration 2682000

preMinutes=`echo "$preDuration / 60" | bc`;
echo "preMinutes $preMinutes"                           # preMinutes 44700

preHours=`echo "$preDuration / 3600" | bc`;
echo "preHours $preHours"                               # preHours 745

icoDuration=`echo "$icoEnd - $icoStart" | bc`;
echo "icoDuration $icoDuration"                         # icoDuration 8726340

icoMinutes=`echo "$icoDuration / 60" | bc`;
echo "icoMinutes $icoMinutes"                           # icoMinutes 145439

icoHours=`echo "$icoDuration / 3600" | bc`;
echo "icoHours $icoHours"                               # icoHours 2423

echo "** Expected Contract params:";
echo "preIcoOpeningTime 1508450400";
echo "icoOpeningTime    1511132400";
echo "closingTime       1519858740";
