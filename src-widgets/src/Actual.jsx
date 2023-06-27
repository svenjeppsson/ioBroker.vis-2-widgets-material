import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import {
    Dialog, DialogContent, DialogTitle, IconButton, Tooltip,
} from '@mui/material';

import ReactEchartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
    GridComponent,
    ToolboxComponent,
    TooltipComponent,
    TitleComponent,
    TimelineComponent,
    LegendComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';

import {
    Close as IconClose,
    DeviceThermostat as ThermostatIcon,
    Opacity as HumidityIcon,
} from '@mui/icons-material';

import { Utils, Icon } from '@iobroker/adapter-react-v5';
import ObjectChart from './ObjectChart';
import Generic from './Generic';

echarts.use([TimelineComponent, ToolboxComponent, TitleComponent, TooltipComponent, GridComponent, LineChart, LegendComponent, SVGRenderer]);

const styles = () => ({
    chart: {
        height: 'calc(100% - 40px)',
        width: '100%',
    },
    mainDiv: {
        marginLeft: 10,
        color: 'rgba(243,177,31)',
        display: 'inline-block',
        lineHeight: '24px',
    },
    temperatureValue: {
        verticalAlign: 'middle',
        fontSize: 28,
    },
    temperatureUnit: {
        paddingLeft: 5,
        opacity: 0.6,
        fontSize: 14,
        verticalAlign: 'middle',
    },
    mainIcon: {
        verticalAlign: 'middle',
        fontSize: 20,
        width: 20,
    },
    secondaryDiv: {
        color: 'rgba(77,134,255)',
        display: 'inline-block',
        float: 'right',
        marginRight: 12,
        lineHeight: '24px',
    },
    humidityValue: {
        verticalAlign: 'middle',
    },
    humidityUnit: {
        paddingLeft: 5,
        opacity: 0.6,
        fontSize: 14,
        verticalAlign: 'middle',
    },
    secondaryIcon: {
        verticalAlign: 'middle',
        fontSize: 20,
    },
    newValueLight: {
        animation: '$newValueAnimationLight 2s ease-in-out',
    },
    '@keyframes newValueAnimationLight': {
        '0%': {
            color: '#00bd00',
        },
        '80%': {
            color: '#008000',
        },
        '100%': {
            color: 'rgba(243,177,31)',
        },
    },
    newValueDark: {
        animation: '$newValueAnimationDark 2s ease-in-out',
    },
    '@keyframes newValueAnimationDark': {
        '0%': {
            color: '#008000',
        },
        '80%': {
            color: '#00bd00',
        },
        '100%': {
            color: 'rgba(243,177,31)',
        },
    },
});

class Actual extends Generic {
    constructor(props) {
        super(props);
        this.state.showDialog = false;
        this.state.dialogTab = 0;
        this.onStateChanged = this.onStateChanged.bind(this);
        this.refContainer = React.createRef();
    }

    static getWidgetInfo() {
        return {
            id: 'tplMaterial2Actual',
            visSet: 'vis-2-widgets-material',

            visSetLabel: 'set_label', // Label of this widget set
            visSetColor: '#0783ff', // Color of this widget set

            visWidgetLabel: 'actual_value_with_chart',  // Label of widget
            visName: 'Actual values',
            visAttrs: [
                {
                    name: 'common',
                    fields: [
                        {
                            name: 'widgetTitle',
                            label: 'name',
                        },
                        {
                            name: 'timeInterval',
                            label: 'chart_time_interval',
                            tooltip: 'hours',
                            type: 'slider',
                            min: 0,
                            max: 48,
                            step: 1,
                            default: 12,
                        },
                        {
                            name: 'updateInterval',
                            label: 'chart_update_interval',
                            tooltip: 'seconds',
                            type: 'slider',
                            min: 10,
                            max: 360,
                            step: 1,
                            default: 60,
                        },
                    ],
                },
                {
                    name: 'main',
                    label: 'main_object',
                    fields: [
                        {
                            label: 'oid',
                            name: 'oid-main',
                            type: 'id',
                        },
                        {
                            label: 'title',
                            name: 'title-main',
                            type: 'text',
                            noButton: true,
                            hidden: '!data["oid-main"] || data["oid-main"] === "nothing_selected"',
                        },
                        {
                            label: 'icon',
                            name: 'icon-main',
                            type: 'icon64',
                            hidden: '!data["oid-main"] || data["oid-main"] === "nothing_selected"',
                        },
                        {
                            label: 'unit',
                            name: 'unit-main',
                            type: 'text',
                            noButton: true,
                            hidden: '!data["oid-main"] || data["oid-main"] === "nothing_selected"',
                        },
                    ],
                },
                {
                    name: 'secondary',
                    label: 'secondary_object',
                    fields: [
                        {
                            label: 'oid',
                            name: 'oid-secondary',
                            type: 'id',
                        },
                        {
                            label: 'title',
                            name: 'title-secondary',
                            type: 'text',
                            noButton: true,
                            hidden: '!data["oid-secondary"] || data["oid-secondary"] === "nothing_selected"',
                        },
                        {
                            label: 'icon',
                            name: 'icon-secondary',
                            type: 'icon64',
                            hidden: '!data["oid-secondary"] || data["oid-secondary"] === "nothing_selected"',
                        },
                        {
                            label: 'unit',
                            name: 'unit-secondary',
                            type: 'text',
                            noButton: true,
                            hidden: '!data["oid-secondary"] || data["oid-secondary"] === "nothing_selected"',
                        },
                    ],
                },
            ],
            visDefaultStyle: {
                width: '100%',
                height: 120,
                position: 'relative',
            },
            visPrev: 'widgets/vis-2-widgets-material/img/prev_actual.png',
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo() {
        return Actual.getWidgetInfo();
    }

    async setStateAsync(newState) {
        return new Promise(resolve => {
            this.setState(newState, resolve);
        });
    }

    async propertiesUpdate() {
        const actualRxData = JSON.stringify(this.state.rxData);
        if (this.lastRxData === actualRxData) {
            return;
        }

        this.lastRxData = actualRxData;

        const objects = {};

        // try to find icons for all OIDs
        if (this.state.rxData['oid-main'] && this.state.rxData['oid-main'] !== 'nothing_selected') {
            // read object itself
            const object = await this.props.context.socket.getObject(this.state.rxData['oid-main']);
            if (!object) {
                objects.main = { common: {} };
            } else {
                object.common = object.common || {};
                if (!object.common.icon && (object.type === 'state' || object.type === 'channel')) {
                    const idArray = this.state.rxData['oid-main'].split('.');

                    // read channel
                    const parentObject = await this.props.context.socket.getObject(idArray.slice(0, -1).join('.'));
                    if (!parentObject?.common?.icon && (object.type === 'state' || object.type === 'channel')) {
                        const grandParentObject = await this.props.context.socket.getObject(idArray.slice(0, -2).join('.'));
                        if (grandParentObject?.common?.icon) {
                            object.common.icon = grandParentObject.common.icon;
                            if (grandParentObject.type === 'instance' || grandParentObject.type === 'adapter') {
                                object.common.icon = `../${grandParentObject.common.name}.admin/${object.common.icon}`;
                            }
                        }
                    } else {
                        object.common.icon = parentObject.common.icon;
                        if (parentObject.type === 'instance' || parentObject.type === 'adapter') {
                            object.common.icon = `../${parentObject.common.name}.admin/${object.common.icon}`;
                        }
                    }
                }
                objects.main = { common: object.common, _id: object._id };
            }
        }

        if (this.state.rxData['oid-secondary'] && this.state.rxData['oid-secondary'] !== 'nothing_selected') {
            // read object itself
            const object = await this.props.context.socket.getObject(this.state.rxData['oid-secondary']);
            if (!object) {
                objects.secondary = { common: {} };
            } else {
                object.common = object.common || {};
                if (!object.common.icon && (object.type === 'state' || object.type === 'channel')) {
                    const idArray = this.state.rxData['oid-secondary'].split('.');

                    // read channel
                    const parentObject = await this.props.context.socket.getObject(idArray.slice(0, -1).join('.'));
                    if (!parentObject?.common?.icon && (object.type === 'state' || object.type === 'channel')) {
                        const grandParentObject = await this.props.context.socket.getObject(idArray.slice(0, -2).join('.'));
                        if (grandParentObject?.common?.icon) {
                            object.common.icon = grandParentObject.common.icon;
                            if (grandParentObject.type === 'instance' || grandParentObject.type === 'adapter') {
                                object.common.icon = `../${grandParentObject.common.name}.admin/${object.common.icon}`;
                            }
                        }
                    } else {
                        object.common.icon = parentObject.common.icon;
                        if (parentObject.type === 'instance' || parentObject.type === 'adapter') {
                            object.common.icon = `../${parentObject.common.name}.admin/${object.common.icon}`;
                        }
                    }
                }
                objects.secondary = { common: object.common, _id: object._id };
            }
        }

        const isChart = (objects.main?.common?.custom && objects.main.common.custom[this.props.systemConfig?.common?.defaultHistory]) ||
            (objects.secondary?.common?.custom && objects.secondary.common.custom[this.props.systemConfig?.common?.defaultHistory]);

        if (JSON.stringify(objects) !== JSON.stringify(this.state.objects) || isChart !== this.state.isChart) {
            await this.setStateAsync({ objects, isChart });
        }

        this.mainTimer && clearInterval(this.mainTimer);
        this.mainTimer = null;

        if (this.state.objects.main?.common?.custom && this.state.objects.main.common.custom[this.props.systemConfig?.common?.defaultHistory]) {
            await this.readHistory(this.state.objects.main._id);
            this.mainTimer = this.mainTimer || setInterval(async () => {
                await this.readHistory(this.state.objects.main._id);
                if (this.state.objects.secondary?.common?.custom && this.state.objects.secondary.common.custom[this.props.systemConfig?.common?.defaultHistory]) {
                    await this.readHistory(this.state.objects.secondary._id);
                }
            }, parseInt(this.state.rxData.updateInterval, 10) || 60000); // every minute by default
        }
        if (this.state.objects.secondary?.common?.custom && this.state.objects.secondary.common.custom[this.props.systemConfig?.common?.defaultHistory]) {
            await this.readHistory(this.state.objects.secondary._id);
            this.mainTimer = this.mainTimer || setInterval(() =>
                this.readHistory(this.state.objects.secondary._id), parseInt(this.state.rxData.updateInterval, 10) || 60000); // every minute by default
        }
    }

    static convertData = (values, chart) => {
        const data = [];
        if (!values || !values.length) {
            return data;
        }
        for (let i = 0; i < values.length; i++) {
            if (values[i].val === true) {
                values[i].val = 1;
            } else if (values[i].val === false) {
                values[i].val = 0;
            }

            data.push({ value: [values[i].ts, values[i].val] });
        }
        if (!chart.min) {
            chart.min = values[0].ts;
            chart.max = values[values.length - 1].ts;
        }

        return data;
    };

    readHistory = async id => {
        const timeInterval = this.state.rxData.timeInterval || 12;
        const now = new Date();
        now.setHours(now.getHours() - timeInterval);
        now.setMinutes(0);
        now.setSeconds(0);
        now.setMilliseconds(0);
        const start = now.getTime();
        const end = Date.now();

        const options = {
            instance: this.props.systemConfig?.common?.defaultHistory || 'history.0',
            start,
            end,
            step: 1800000, // 30 minutes
            from: false,
            ack: false,
            q: false,
            addID: false,
            aggregate: 'minmax',
        };

        let chart;
        return this.props.context.socket.getHistory(id, options)
            .then(_chart => {
                chart = _chart;
                return this.props.context.socket.getState(id);
            })
            .then(state => {
                // sort
                if (chart && chart[0] && chart[0].ts !== start) {
                    chart.unshift({ ts: start, val: null });
                }
                if (chart) {
                    chart.sort((a, b) => (a.ts > b.ts ? 1 : (a.ts < b.ts ? -1 : 0))).filter(e => e.val !== null);
                    state && state.val !== null && state.val !== undefined && chart.push({ ts: Date.now(), val: state.val });

                    const _chart = {};
                    _chart.data = Actual.convertData(chart, _chart);
                    this.setState({ [`chart-data-${id}`]: _chart });
                }
            })
            .catch(e => console.error(`Cannot read history: ${e}`));
    };

    async componentDidMount() {
        super.componentDidMount();
        await this.propertiesUpdate();
    }

    componentWillUnmount() {
        clearInterval(this.mainTimer);
        this.mainTimer = null;
        super.componentWillUnmount();
    }

    async onRxDataChanged() {
        await this.propertiesUpdate();
    }

    getOptions() {
        const series = [];
        if (this.state[`chart-data-${this.state.rxData['oid-main']}`]) {
            let name = this.state.rxData['title-main'] || Generic.getText(this.state.objects.main.common.name) || '';
            if (!name) {
                if (this.state.objects.secondary.common.role?.includes('temperature')) {
                    name = Generic.t('temperature').replace('vis_2_widgets_material_', '');
                }
            }
            series.push({
                backgroundColor: 'rgba(243,177,31,0.14)',
                color: 'rgba(243,177,31,0.65)',
                type: 'line',
                smooth: true,
                showSymbol: false,
                itemStyle: { normal: { areaStyle: { type: 'default' } } },
                data: this.state[`chart-data-${this.state.rxData['oid-main']}`].data,
                name,
            });
        }
        if (this.state[`chart-data-${this.state.rxData['oid-secondary']}`]) {
            let name = this.state.rxData['title-secondary'] || Generic.getText(this.state.objects.secondary.common.name) || '';
            if (!name) {
                if (this.state.objects.secondary.common.role?.includes('humidity')) {
                    name = Generic.t('humidity').replace('vis_2_widgets_material_', '');
                }
            }

            series.push({
                backgroundColor: 'rgba(77,134,255,0.14)',
                color: 'rgba(77,134,255,0.44)',
                type: 'line',
                smooth: true,
                showSymbol: false,
                itemStyle: { normal: { areaStyle: { type: 'default' } } },
                data: this.state[`chart-data-${this.state.rxData['oid-secondary']}`].data,
                name,
            });
        }

        return {
            animation: false,
            backgroundColor: 'transparent',
            grid: {
                show: false,
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
            },
            legend: undefined,
            calculable : true,
            xAxis: {
                show: false,
                boundaryGap: false,
                type: 'time',
            },
            yAxis: {
                show: false,
            },
            series,
        };
    }

    componentDidUpdate() {
        if (this.refContainer.current && this.state.containerHeight !== this.refContainer.current.clientHeight) {
            this.setState({ containerHeight: this.refContainer.current.clientHeight });
        }
    }

    renderDialog() {
        if (!this.state.showDialog) {
            return null;
        }
        return <Dialog
            sx={{ '& .MuiDialog-paper': { height: '100%' } }}
            maxWidth="lg"
            fullWidth
            open={!0}
            onClose={() => this.setState({ showDialog: false })}
        >
            <DialogTitle>
                {this.state.rxData.widgetTitle}
                <IconButton
                    style={{ float: 'right' }}
                    onClick={() => this.setState({ showDialog: false })}
                >
                    <IconClose />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <ObjectChart
                    t={key => Generic.t(key)}
                    lang={Generic.getLanguage()}
                    socket={this.props.context.socket}
                    obj={this.state.objects.main || this.state.objects.secondary}
                    obj2={this.state.objects.main ? this.state.objects.secondary : null}
                    unit={this.state.objects.main ?
                        (this.state.rxData['unit-main'] || this.state.objects.main.common.unit) :
                        (this.state.rxData['unit-secondary'] || this.state.objects.secondary.common.unit)}
                    unit2={this.state.rxData['unit-secondary'] || this.state.objects.secondary.common.unit}
                    title={this.state.objects.main ?
                        (this.state.rxData['title-main'] || Generic.getText(this.state.objects.main.common.name)) :
                        (this.state.rxData['title-secondary'] || Generic.getText(this.state.objects.secondary.common.name))}
                    title2={this.state.rxData['title-secondary'] || Generic.getText(this.state.objects.secondary.common.name)}
                    objLineType="line"
                    obj2LineType="line"
                    objColor={this.state.objects.main ? 'rgba(243,177,31,0.65)' : 'rgba(77,134,255,0.44)'}
                    obj2Color="rgba(77,134,255,0.44)"
                    objBackgroundColor={this.state.objects.main ? 'rgba(243,177,31,0.14)' : 'rgba(77,134,255,0.14)'}
                    obj2BackgroundColor="rgba(77,134,255,0.14)"
                    themeType={this.props.themeType}
                    defaultHistory={this.props.systemConfig?.common?.defaultHistory || 'history.0'}
                    noToolbar={false}
                    systemConfig={this.props.systemConfig}
                    dateFormat={this.props.systemConfig.common.dateFormat}
                    chartTitle=""
                />
            </DialogContent>
        </Dialog>;
    }

    renderWidgetBody(props) {
        super.renderWidgetBody(props);

        const actualRxData = JSON.stringify(this.state.rxData);
        if (this.lastRxData !== actualRxData) {
            this.updateTimeout = this.updateTimeout || setTimeout(async () => {
                this.updateTimeout = null;
                await this.propertiesUpdate();
            }, 50);
        }

        const onCardClick = !this.state.showDialog && this.state.isChart ? e => {
            e.preventDefault();
            e.stopPropagation();
            this.setState({ showDialog: true });
        } : undefined;

        const classUpdateVal = this.props.themeType === 'dark' ? this.props.classes.newValueDark : this.props.classes.newValueLight;

        const mainValue = this.state.objects && this.state.objects.main && this.state.values[`${this.state.rxData['oid-main']}.val`] !== undefined ?
            this.formatValue(this.state.values[`${this.state.rxData['oid-main']}.val`]) : undefined;

        const secondaryValue = this.state.objects && this.state.objects.secondary && this.state.values[`${this.state.rxData['oid-secondary']}.val`] !== undefined ?
            this.formatValue(this.state.values[`${this.state.rxData['oid-secondary']}.val`], 0) : undefined;

        let mainIcon = this.state.rxData['icon-main'] || this.state.objects?.main?.common?.icon;
        if (mainIcon) {
            mainIcon = <Icon src={mainIcon} style={{ width: 24 }} className={this.props.classes.mainIcon} />;
        } else if (this.state.objects?.main?.common?.role?.includes('temperature') || this.state.objects?.main?.common?.unit?.includes('°')) {
            mainIcon = <ThermostatIcon className={this.props.classes.mainIcon} />;
        } else {
            mainIcon = null;
        }

        let secondaryIcon = this.state.rxData['icon-secondary'] || this.state.objects?.secondary?.common?.icon;
        if (secondaryIcon) {
            secondaryIcon = <Icon src={secondaryIcon} style={{ width: 20 }} className={this.props.classes.secondaryIcon} />;
        } else if (this.state.objects?.secondary?.common?.role?.includes('humidity')) {
            secondaryIcon = <HumidityIcon className={this.props.classes.secondaryIcon} />;
        } else {
            secondaryIcon = null;
        }

        const content = <div style={{ width: '100%', height: '100%' }} ref={this.refContainer}>
            {mainValue !== undefined ?
                <Tooltip title={this.state.rxData['title-main'] || Generic.getText(this.state.objects.main.common.name) || null}>
                    <div className={this.props.classes.mainDiv}>
                        {mainIcon}
                        <span key={`${mainValue}valText`} className={Utils.clsx(this.props.classes.temperatureValue, classUpdateVal)}>{mainValue}</span>
                        <span className={this.props.classes.temperatureUnit}>{this.state.rxData['unit-main'] || this.state.objects.main.common.unit}</span>
                    </div>
                </Tooltip>
                : null}
            {secondaryValue !== undefined ?
                <Tooltip title={this.state.rxData['title-secondary'] || Generic.getText(this.state.objects.secondary.common.name) || null}>
                    <div className={this.props.classes.secondaryDiv}>
                        {secondaryIcon}
                        <span key={`${secondaryValue}valText`} className={Utils.clsx(this.props.classes.humidityValue, classUpdateVal)}>{secondaryValue}</span>
                        <span className={this.props.classes.humidityUnit}>{this.state.rxData['unit-secondary'] || this.state.objects.secondary.common.unit}</span>
                    </div>
                </Tooltip>
                : null}
            {this.state.containerHeight && (this.state[`chart-data-${this.state.rxData['oid-main']}`] || this.state[`chart-data-${this.state.rxData['oid-secondary']}`]) ?
                <ReactEchartsCore
                    className={this.props.classes.chart}
                    echarts={echarts}
                    option={this.getOptions()}
                    notMerge
                    lazyUpdate
                    theme={this.props.themeType === 'dark' ? 'dark' : ''}
                    style={{ height: this.state.containerHeight - 42, width: '100%' }}
                    opts={{ renderer: 'svg' }}
                />
                : null}
            {this.renderDialog()}
        </div>;

        return this.wrapContent(content, null, { paddingLeft: 0, paddingRight: 0 }, { paddingLeft: 16 }, onCardClick);
    }
}

Actual.propTypes = {
    systemConfig: PropTypes.object,
    socket: PropTypes.object,
    themeType: PropTypes.string,
    style: PropTypes.object,
    data: PropTypes.object,
};

export default withStyles(styles)(Actual);
