import CheckBox from '@/Components/reusable/CheckBox';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

export default function Welcome({
    auth,
    laravelVersion,
    phpVersion,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
    const anonym = (c: boolean) => {
        console.log(c);
    }

    const change = (c: boolean) => {
        console.log(c);
    }
    return (
        <div className='w-full h-screen flex flex-col items-center justify-center'>
            <CheckBox onChange={change} round="lg" size='medium' color='black' />
        </div>
    );
}
