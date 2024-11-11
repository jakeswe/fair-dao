import { useEffect, useState } from 'react'

import {OPTION_ADDRESS} from "../../constants/options.js"
import {OPTION_CONTRIBUTION} from "../../constants/options.js"
import {OPTION_OWNER} from "../../constants/options.js"
import {OPTION_TIDY} from "../../constants/options.js"
import {OPTION_RADIAL} from "../../constants/options.js"

const PullDownHeader = ({root, optionValue, setOptionValue, optionTreeValue, setOptionTreeValue}) => {

    const handleOptionChange = async (value) => {
        setOptionValue(value.target.value);
    }

    const handleChartOptionChange = async (value) => {
        setOptionTreeValue(value.target.value);
    }
    return(
        <>
            {root != null && <div className="flex justify-between">
            <select onChange={handleOptionChange} className="select select-primary mx-5 text-left">
                <option value={OPTION_ADDRESS}>Address</option>
                <option value={OPTION_CONTRIBUTION}>Contribution</option>
                <option value={OPTION_OWNER}>Owner</option>
            </select>
            <select onChange={handleChartOptionChange} className="select select-primary text-right">
                <option className="text-left" value={OPTION_RADIAL}>Radial Tree</option>
                <option className="text-left" value={OPTION_TIDY}>Tidy Tree</option>
            </select>
            </div>}
        </>);
};

export default PullDownHeader;