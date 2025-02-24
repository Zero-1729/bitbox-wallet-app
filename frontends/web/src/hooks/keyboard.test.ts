/**
 * Copyright 2022 Shift Crypto AG
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { fireEvent } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useEsc } from './keyboard';
import { act } from 'react-dom/test-utils';

describe('useEsc', () => {
  it('should fire its callback when escape key gets pressed', () => {
    const mock = jest.fn();
    renderHook((() => useEsc(mock)));
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape', code: 27 });
    });
    expect(mock).toHaveBeenCalled();
  });
});

