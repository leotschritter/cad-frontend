# WeatherForecastResourceApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**apiWeatherForecastCoordinatesGet**](#apiweatherforecastcoordinatesget) | **GET** /api/weather/forecast/coordinates | Get Weather Forecast By Coordinates|
|[**apiWeatherForecastCoordinatesPost**](#apiweatherforecastcoordinatespost) | **POST** /api/weather/forecast/coordinates | Fetch Weather Forecast By Coordinates|
|[**apiWeatherForecastLocationDelete**](#apiweatherforecastlocationdelete) | **DELETE** /api/weather/forecast/location | Delete Weather Forecast By Location|
|[**apiWeatherForecastLocationGet**](#apiweatherforecastlocationget) | **GET** /api/weather/forecast/location | Get Weather Forecast By Location|
|[**apiWeatherForecastsGet**](#apiweatherforecastsget) | **GET** /api/weather/forecasts | Get All Weather Forecasts|

# **apiWeatherForecastCoordinatesGet**
> apiWeatherForecastCoordinatesGet()


### Example

```typescript
import {
    WeatherForecastResourceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WeatherForecastResourceApi(configuration);

let lat: number; // (optional) (default to undefined)
let lon: number; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiWeatherForecastCoordinatesGet(
    lat,
    lon
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **lat** | [**number**] |  | (optional) defaults to undefined|
| **lon** | [**number**] |  | (optional) defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiWeatherForecastCoordinatesPost**
> apiWeatherForecastCoordinatesPost()


### Example

```typescript
import {
    WeatherForecastResourceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WeatherForecastResourceApi(configuration);

let lat: number; // (optional) (default to undefined)
let location: string; // (optional) (default to undefined)
let lon: number; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiWeatherForecastCoordinatesPost(
    lat,
    location,
    lon
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **lat** | [**number**] |  | (optional) defaults to undefined|
| **location** | [**string**] |  | (optional) defaults to undefined|
| **lon** | [**number**] |  | (optional) defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiWeatherForecastLocationDelete**
> apiWeatherForecastLocationDelete()


### Example

```typescript
import {
    WeatherForecastResourceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WeatherForecastResourceApi(configuration);

let location: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiWeatherForecastLocationDelete(
    location
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **location** | [**string**] |  | (optional) defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiWeatherForecastLocationGet**
> apiWeatherForecastLocationGet()


### Example

```typescript
import {
    WeatherForecastResourceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WeatherForecastResourceApi(configuration);

let location: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.apiWeatherForecastLocationGet(
    location
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **location** | [**string**] |  | (optional) defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **apiWeatherForecastsGet**
> apiWeatherForecastsGet()


### Example

```typescript
import {
    WeatherForecastResourceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new WeatherForecastResourceApi(configuration);

const { status, data } = await apiInstance.apiWeatherForecastsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

