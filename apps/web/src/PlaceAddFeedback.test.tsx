import {act,renderHook} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {usePlaceAddFeedback,PLACE_ADD_FEEDBACK_MS as delay,PLACE_ADD_FADE_MS as fade} from '../../../packages/shared/usePlaceAddFeedback';
beforeEach(()=>vi.useFakeTimers());afterEach(()=>vi.useRealTimers());
it('starts hidden despite saved selections, resets the timer for each addition and fades without altering picks',()=>{
 const picks=['old','first','second','third'],{result}=renderHook(()=>usePlaceAddFeedback(picks));expect(result.current.visible).toBe(false);expect(result.current.ids).toEqual([]);act(()=>result.current.added('first'));expect(result.current.visible).toBe(true);act(()=>vi.advanceTimersByTime(delay-100));act(()=>result.current.added('second'));act(()=>vi.advanceTimersByTime(101));expect(result.current.visible).toBe(true);expect(result.current.fading).toBe(false);expect(result.current.ids).toEqual(['first','second']);act(()=>vi.advanceTimersByTime(delay-101));expect(result.current.fading).toBe(true);act(()=>vi.advanceTimersByTime(fade));expect(result.current.visible).toBe(false);expect(picks).toEqual(['old','first','second','third']);act(()=>result.current.added('third'));expect(result.current.ids).toEqual(['first','second','third']);expect(result.current.visible).toBe(true);expect(result.current.fading).toBe(false);
});
it('pauses auto-hide during review and starts a new timeout when review closes',()=>{
 const {result}=renderHook(()=>usePlaceAddFeedback(['first']));act(()=>result.current.added('first'));act(()=>result.current.setPaused(true));act(()=>vi.advanceTimersByTime(30000));expect(result.current.visible).toBe(true);expect(result.current.fading).toBe(false);act(()=>result.current.setPaused(false));act(()=>vi.advanceTimersByTime(delay+fade));expect(result.current.visible).toBe(false);
});
it('filters removed selections and clears visibility when the viewer is inactive',()=>{
 const {result,rerender}=renderHook(({selected,active})=>usePlaceAddFeedback(selected,active),{initialProps:{selected:['a','b'],active:true}});act(()=>result.current.added('a'));act(()=>result.current.added('b'));rerender({selected:['b'],active:true});expect(result.current.ids).toEqual(['b']);rerender({selected:['b'],active:false});expect(result.current.visible).toBe(false);rerender({selected:['b'],active:true});expect(result.current.visible).toBe(false);expect(result.current.ids).toEqual(['b']);
});
it('cleans up both idle and fade timers when leaving the viewer',()=>{
 const {result,unmount}=renderHook(()=>usePlaceAddFeedback(['a']));act(()=>result.current.added('a'));act(()=>vi.advanceTimersByTime(delay));expect(result.current.fading).toBe(true);unmount();expect(vi.getTimerCount()).toBe(0);
});
