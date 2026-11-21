import {screen,within} from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
export async function chooseTravelAnswer(user:ReturnType<typeof userEvent.setup>,preferred?:string){const options=within(screen.getByRole('radiogroup',{name:'Your answer'})).getAllByRole('radio'),picked=options.find(o=>o.getAttribute('aria-label')?.toLowerCase()===preferred?.toLowerCase())??options[0];await user.click(picked);return picked.getAttribute('aria-label')!;}
