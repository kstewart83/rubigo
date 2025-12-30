/* @refresh reload */
import { render } from 'solid-js/web';
import App from './App';
import ButtonTest from './ButtonTest';
import SpecDrivenPOC from './SpecDrivenPOC';

const root = document.getElementById('root');
if (root) {
    // Simple URL-based routing
    const path = window.location.pathname;
    const getPage = () => {
        if (path === '/button-test') return <ButtonTest />;
        if (path === '/poc') return <SpecDrivenPOC />;
        return <App />;
    };
    render(getPage, root);
}
