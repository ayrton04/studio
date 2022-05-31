// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import { getNormalizedMessage } from "./conversion";
import { LogLevel, LogMessageEvent } from "./types";

function mapLogLevelBySourceId(logLevel: number, dataSourceId?: string): number {
  if (dataSourceId === "ros2-local-bagfile" || dataSourceId === "ros2-socket") {
    return (
      {
        [LogLevel.UNKNOWN]: 0,
        [LogLevel.DEBUG]: 10,
        [LogLevel.INFO]: 20,
        [LogLevel.WARN]: 30,
        [LogLevel.ERROR]: 40,
        [LogLevel.FATAL]: 50,
      }[logLevel] ?? logLevel
    );
  }

  return logLevel;
}

export default function filterMessages(
  events: readonly LogMessageEvent[],
  filter: { minLogLevel: number; searchTerms: string[]; dataSourceId?: string },
): readonly LogMessageEvent[] {
  const { minLogLevel, searchTerms, dataSourceId } = filter;
  const hasActiveFilters = minLogLevel > 1 || searchTerms.length > 0;
  // return all messages if we wouldn't filter anything
  if (!hasActiveFilters) {
    return events;
  }

  const effectiveLogLevel = mapLogLevelBySourceId(minLogLevel, dataSourceId);

  const searchTermsInLowerCase = searchTerms.map((term) => term.toLowerCase());

  return events.filter((event) => {
    const logMessage = event.message;
    if (logMessage.level < effectiveLogLevel) {
      return false;
    }

    if (searchTerms.length === 0) {
      return true;
    }

    const lowerCaseName = logMessage.name?.toLowerCase() ?? "";
    const lowerCaseMsg = getNormalizedMessage(logMessage).toLowerCase();
    return searchTermsInLowerCase.some(
      (term) => lowerCaseName.includes(term) || lowerCaseMsg.includes(term),
    );
  });
}
