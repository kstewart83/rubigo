/* @refresh reload */
import { render } from 'solid-js/web';
import App from './App';
import ButtonTest from './ButtonTest';

const root = document.getElementById('root');
if (root) {
    // Simple URL-based routing
    const isButtonTest = window.location.pathname === '/button-test';
    render(() => isButtonTest ? <ButtonTest /> : <App />, root);
}
