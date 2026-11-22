import {screen,waitFor} from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
export async function fillProfileIdentity(user:ReturnType<typeof userEvent.setup>,username='test_roamer'){
 const field=screen.getByRole('textbox',{name:'Username'}) as HTMLInputElement;if(!field.value)await user.type(field,username);const consent=screen.getByRole('checkbox',{name:'I’m 13 or older.'}) as HTMLInputElement;if(!consent.checked)await user.click(consent);await screen.findByText(/^@[a-z][a-z0-9_]+ is available$/,undefined,{timeout:2000});
}
