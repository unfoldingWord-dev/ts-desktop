import {useEffect, useState} from "react";
import {debounce} from 'lodash';

/**
 *
 * @param scrollRegion the element that will produce scroll events.
 */
export function useStableResize(scrollRegion) {
    const [visible, setVisible] = useState();
    const [size, setSize] = useState({
        height: window.innerHeight,
        width: window.innerWidth
    });
    const [lastSize, setLastSize] = useState({
        height: window.innerHeight,
        width: window.innerWidth
    });

    function isInBounds(elem, bounds) {
        const bounding = elem.getBoundingClientRect();
        return (
            bounding.top >= 0 &&
            bounding.left >= 0 &&
            bounding.bottom <= bounds.bottom &&
            bounding.right <= bounds.right
        );
    }

    // keep visible element in the viewport
    useEffect(() => {
        if (visible && size.width !== lastSize.width && size.height !== lastSize.height) {
            visible.scrollIntoView();
            setLastSize(size);
        }
    }, [visible, size]);

    // monitor window size
    useEffect(() => {
        function handleResize() {
            setSize({
                height: window.innerHeight,
                width: window.innerWidth
            });
        }

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // keep track of the visible element
    useEffect(() => {
        const handleScroll = debounce(() => {
            for(const el of scrollRegion.getElementsByTagName('*')) {
                if(isInBounds(el, scrollRegion.getBoundingClientRect())) {
                    setVisible(el);
                    break;
                }
            }
        }, 50);

        if(scrollRegion !== null) {
            scrollRegion.addEventListener('scroll', handleScroll);
            return () => {
                scrollRegion.removeEventListener('scroll', handleScroll);
            };
        }
    }, [scrollRegion]);
}
